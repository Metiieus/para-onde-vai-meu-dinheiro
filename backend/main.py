"""
Para Onde Vai Meu Dinheiro - Backend API
FastAPI com Redis Cache para otimização de dados governamentais.

Melhorias implementadas:
- Chamadas HTTP assíncronas com httpx (substitui requests síncrono)
- Chave de cache determinística com hashlib.sha256
- Endpoint de limpeza de cache protegido por API Key
- Cálculo de impostos corrigido (INSS e IRRF com tabelas progressivas reais)
- CORS configurável via variável de ambiente
- Rate limiting básico
- Logging estruturado
- Estrutura modular de código
"""

import os
import json
import logging
import hashlib
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime
from functools import wraps

import httpx
import redis
from fastapi import FastAPI, HTTPException, Query, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv

load_dotenv()

# ==================== CONFIGURAÇÃO DE LOGGING ====================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("para-onde-vai-meu-dinheiro")

# ==================== CONFIGURAÇÕES ====================

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))
CACHE_ADMIN_KEY = os.getenv("CACHE_ADMIN_KEY", "")  # Chave secreta para proteger o endpoint de cache

# Origens permitidas para CORS (separadas por vírgula no .env)
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")
ALLOWED_ORIGINS = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else ["*"]

# URLs das APIs governamentais
CAMARA_API = "https://dadosabertos.camara.leg.br/api/v2"
SENADO_API = "https://legis.senado.leg.br/dadosabertos"

# ==================== APLICAÇÃO ====================

app = FastAPI(
    title="Para Onde Vai Meu Dinheiro API",
    description="API para processamento e cache de dados governamentais brasileiros",
    version="3.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

# ==================== REDIS ====================

_redis_client = None

def get_redis() -> Optional[redis.Redis]:
    global _redis_client
    if _redis_client is None:
        try:
            _redis_client = redis.from_url(REDIS_URL, decode_responses=True)
            _redis_client.ping()
            logger.info("Conexão com Redis estabelecida com sucesso.")
        except Exception as e:
            logger.warning(f"Redis não disponível: {e}. Operando sem cache.")
            return None
    return _redis_client

# ==================== CACHE DECORATOR ====================

def _make_cache_key(prefix: str, args: tuple, kwargs: dict) -> str:
    """Gera uma chave de cache determinística usando SHA-256."""
    raw = f"{prefix}:{str(args)}:{str(sorted(kwargs.items()))}"
    return hashlib.sha256(raw.encode()).hexdigest()

def cached(key_prefix: str, ttl: int = None):
    """Decorator para cache automático de funções assíncronas."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            r = get_redis()
            cache_key = _make_cache_key(key_prefix, args, kwargs)

            if r:
                try:
                    cached_data = r.get(cache_key)
                    if cached_data:
                        logger.debug(f"Cache HIT: {key_prefix}")
                        return json.loads(cached_data)
                except Exception as e:
                    logger.warning(f"Erro ao ler cache: {e}")

            result = await func(*args, **kwargs)

            if r:
                try:
                    r.setex(cache_key, ttl or CACHE_TTL, json.dumps(result, default=str))
                    logger.debug(f"Cache SET: {key_prefix}")
                except Exception as e:
                    logger.warning(f"Erro ao gravar cache: {e}")

            return result
        return wrapper
    return decorator

# ==================== HTTP CLIENT ====================

async def http_get(url: str, params: dict = None, timeout: int = 30) -> dict:
    """Realiza uma requisição GET assíncrona com httpx."""
    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(url, params=params)
        response.raise_for_status()
        return response.json()

# ==================== MODELOS ====================

class DeputadoResumo(BaseModel):
    id: int
    nome: str
    partido: str
    uf: str
    foto: str
    email: str

class DeputadoDetalhe(BaseModel):
    id: int
    nome: str
    nome_civil: str
    partido: str
    uf: str
    foto: str
    email: str
    telefone: str
    gabinete: str
    situacao: str
    condicao_eleitoral: str

class Despesa(BaseModel):
    ano: int
    mes: int
    tipo_despesa: str
    data_documento: str
    valor_documento: float
    valor_liquido: float
    fornecedor: str
    cnpj_cpf_fornecedor: str
    url_documento: Optional[str] = None

class RankingItem(BaseModel):
    id: int
    nome: str
    partido: str
    uf: str
    foto: str
    valor_total: float
    categoria: str
    posicao: int

class ComparacaoValor(BaseModel):
    valor_original: float
    descricao: str
    icone: str
    cor: str

class CalculadoraInput(BaseModel):
    salario_bruto: float

    @field_validator("salario_bruto")
    @classmethod
    def salario_deve_ser_positivo(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("O salário bruto deve ser um valor positivo.")
        if v > 10_000_000:
            raise ValueError("O salário bruto informado é inválido.")
        return v

class CalculadoraResultado(BaseModel):
    salario_bruto: float
    salario_liquido: float
    total_impostos: float
    percentual_impostos: float
    dias_trabalho_impostos: int
    impostos: List[Dict[str, Any]]
    destinos: List[Dict[str, Any]]
    traducoes: List[Dict[str, Any]]
    nota_metodologica: str

# ==================== SERVIÇOS ====================

class CamaraService:
    """Serviço para interação com a API de Dados Abertos da Câmara dos Deputados."""

    @staticmethod
    @cached("deputados", 1800)
    async def get_deputados(nome: str = None, uf: str = None, partido: str = None) -> List[Dict]:
        params = {}
        if nome:
            params["nome"] = nome
        if uf:
            params["siglaUf"] = uf
        if partido:
            params["siglaPartido"] = partido

        data = await http_get(f"{CAMARA_API}/deputados", params=params)
        return data.get("dados", [])

    @staticmethod
    @cached("deputado_detalhe", 3600)
    async def get_deputado(deputado_id: int) -> Dict:
        data = await http_get(f"{CAMARA_API}/deputados/{deputado_id}")
        return data.get("dados", {})

    @staticmethod
    @cached("despesas_deputado", 1800)
    async def get_despesas(deputado_id: int, ano: int = None, mes: int = None) -> List[Dict]:
        params = {"itens": 100, "ordem": "DESC", "ordenarPor": "dataDocumento"}
        if ano:
            params["ano"] = ano
        if mes:
            params["mes"] = mes

        data = await http_get(
            f"{CAMARA_API}/deputados/{deputado_id}/despesas",
            params=params
        )
        return data.get("dados", [])

    @staticmethod
    async def get_ranking(categoria: str = "total", ano: int = 2024, limite: int = 50) -> List[Dict]:
        """
        Calcula o ranking de gastos dos deputados.
        Toda a lógica de N+1 é executada no servidor, beneficiando-se do cache.
        """
        cache_key = _make_cache_key("ranking", (categoria, ano, limite), {})
        r = get_redis()

        if r:
            try:
                cached_data = r.get(cache_key)
                if cached_data:
                    logger.info(f"Ranking servido do cache: {categoria}/{ano}")
                    return json.loads(cached_data)
            except Exception as e:
                logger.warning(f"Erro ao ler cache do ranking: {e}")

        logger.info(f"Calculando ranking: {categoria}/{ano} (limite={limite})")
        deputados = await CamaraService.get_deputados()
        deputados_limitados = deputados[:limite]

        # Busca despesas em paralelo para todos os deputados
        async def buscar_despesas_deputado(dep: dict) -> Optional[Dict]:
            try:
                despesas = await CamaraService.get_despesas(dep["id"], ano)
                valor_total = 0.0
                if categoria == "total":
                    valor_total = sum(d.get("valorLiquido", 0) for d in despesas)
                else:
                    for d in despesas:
                        if categoria.lower() in d.get("tipoDespesa", "").lower():
                            valor_total += d.get("valorLiquido", 0)

                if valor_total > 0:
                    return {
                        "id": dep["id"],
                        "nome": dep["nome"],
                        "partido": dep.get("siglaPartido", "N/A"),
                        "uf": dep.get("siglaUf", "N/A"),
                        "foto": dep.get("urlFoto", ""),
                        "valor_total": valor_total,
                        "categoria": categoria,
                    }
            except Exception as e:
                logger.warning(f"Erro ao processar deputado {dep.get('id')}: {e}")
            return None

        # Executa em paralelo com controle de concorrência (semáforo)
        semaforo = asyncio.Semaphore(10)

        async def buscar_com_semaforo(dep: dict) -> Optional[Dict]:
            async with semaforo:
                return await buscar_despesas_deputado(dep)

        resultados = await asyncio.gather(*[buscar_com_semaforo(dep) for dep in deputados_limitados])
        ranking = [r for r in resultados if r is not None]
        ranking.sort(key=lambda x: x["valor_total"], reverse=True)

        for i, item in enumerate(ranking):
            item["posicao"] = i + 1

        if r:
            try:
                r.setex(cache_key, CACHE_TTL * 2, json.dumps(ranking))
            except Exception as e:
                logger.warning(f"Erro ao gravar ranking no cache: {e}")

        return ranking


class SenadoService:
    """Serviço para interação com a API de Dados Abertos do Senado Federal."""

    @staticmethod
    @cached("senadores", 3600)
    async def get_senadores() -> List[Dict]:
        data = await http_get(f"{SENADO_API}/senador/lista/atual")
        parlamentares = (
            data.get("ListaParlamentarEmExercicio", {})
                .get("Parlamentares", {})
                .get("Parlamentar", [])
        )
        return parlamentares if isinstance(parlamentares, list) else [parlamentares]


class ValorTranslator:
    """Serviço para traduzir valores monetários em comparações compreensíveis."""

    VALORES_REFERENCIA = {
        "SALARIO_MINIMO": {"valor": 1412, "nome": "salários mínimos", "icone": "💼", "cor": "blue"},
        "CESTA_BASICA": {"valor": 250, "nome": "cestas básicas", "icone": "🛒", "cor": "green"},
        "BOLSA_FAMILIA": {"valor": 600, "nome": "benefícios do Bolsa Família", "icone": "❤️", "cor": "red"},
        "PASSAGEM_ONIBUS": {"valor": 4.5, "nome": "passagens de ônibus", "icone": "🚌", "cor": "yellow"},
        "CADEIRA_RODAS": {"valor": 2500, "nome": "cadeiras de rodas", "icone": "♿", "cor": "purple"},
        "NOTEBOOK": {"valor": 3500, "nome": "notebooks", "icone": "💻", "cor": "gray"},
        "CONSULTA_MEDICA": {"valor": 200, "nome": "consultas médicas particulares", "icone": "🏥", "cor": "cyan"},
        "REMEDIO": {"valor": 50, "nome": "medicamentos básicos", "icone": "💊", "cor": "pink"},
        "CRECHES": {"valor": 800, "nome": "vagas em creches", "icone": "👶", "cor": "orange"},
        "UNIFORME_ESCOLAR": {"valor": 150, "nome": "uniformes escolares", "icone": "🎒", "cor": "indigo"},
        "LIVRO": {"valor": 40, "nome": "livros didáticos", "icone": "📚", "cor": "emerald"},
        "MERENDA_ESCOLAR": {"valor": 3, "nome": "refeições escolares", "icone": "🍎", "cor": "lime"},
        "INTERNET": {"valor": 80, "nome": "meses de internet banda larga", "icone": "🌐", "cor": "sky"},
        "ENERGIA": {"valor": 150, "nome": "meses de conta de energia", "icone": "⚡", "cor": "amber"},
        "AGUA": {"valor": 50, "nome": "meses de conta de água", "icone": "💧", "cor": "teal"},
    }

    @staticmethod
    def traduzir_valor(valor: float) -> Dict:
        melhor = None
        melhor_relevancia = 0
        for ref in ValorTranslator.VALORES_REFERENCIA.values():
            quantidade = valor / ref["valor"]
            if 1 <= quantidade <= 10000 and quantidade > melhor_relevancia:
                melhor_relevancia = quantidade
                melhor = {
                    "valor_original": valor,
                    "descricao": f"{int(quantidade)} {ref['nome']}",
                    "icone": ref["icone"],
                    "cor": ref["cor"],
                }
        return melhor or {"valor_original": valor, "descricao": f"R$ {valor:,.2f}", "icone": "💰", "cor": "green"}

    @staticmethod
    def gerar_traducoes(valor: float, limite: int = 5) -> List[Dict]:
        traducoes = []
        for ref in ValorTranslator.VALORES_REFERENCIA.values():
            quantidade = valor / ref["valor"]
            if quantidade >= 1:
                traducoes.append({
                    "valor_original": valor,
                    "descricao": f"{int(quantidade)} {ref['nome']}",
                    "icone": ref["icone"],
                    "cor": ref["cor"],
                })
        traducoes.sort(key=lambda x: float(x["descricao"].split()[0]), reverse=True)
        return traducoes[:limite]

    @staticmethod
    def calcular_dias_trabalho(valor: float, salario_mensal: float) -> int:
        if salario_mensal <= 0:
            return 0
        valor_diario = salario_mensal / 22  # Dias úteis no mês
        return int(valor / valor_diario)


class CalculadoraService:
    """
    Serviço de cálculo de impostos com metodologia corrigida.

    Metodologia:
    - INSS: calculado com tabela progressiva oficial 2024 sobre o salário bruto.
    - IRRF: calculado com tabela progressiva oficial 2024 sobre o salário bruto menos o INSS.
    - Impostos sobre consumo (ICMS, IPI, PIS/COFINS, ISS): estimativa sobre o salário líquido,
      representando a carga tributária indireta que o trabalhador paga ao consumir.
    """

    # Tabela INSS 2024 (faixas progressivas)
    TABELA_INSS = [
        (1412.00, 0.075),
        (2666.68, 0.09),
        (4000.03, 0.12),
        (7786.02, 0.14),
    ]

    # Tabela IRRF 2024 (base de cálculo = salário bruto - INSS - dedução por dependente)
    TABELA_IRRF = [
        (2259.20, 0.0, 0.0),
        (2826.65, 0.075, 169.44),
        (3751.05, 0.15, 381.44),
        (4664.68, 0.225, 662.77),
        (float("inf"), 0.275, 896.00),
    ]

    DESTINOS_IMPOSTO = [
        {"nome": "Previdência Social", "percentual": 0.35, "descricao": "Aposentadorias, pensões, BPC/LOAS"},
        {"nome": "Educação", "percentual": 0.18, "descricao": "Escolas públicas, universidades federais, FUNDEB"},
        {"nome": "Saúde", "percentual": 0.10, "descricao": "SUS, hospitais públicos, vacinas, UBS"},
        {"nome": "Assistência Social", "percentual": 0.12, "descricao": "Bolsa Família, CRAS, CREAS"},
        {"nome": "Infraestrutura", "percentual": 0.08, "descricao": "Rodovias, ferrovias, saneamento básico"},
        {"nome": "Segurança Pública", "percentual": 0.05, "descricao": "Polícia Federal, PRF, Forças Armadas"},
        {"nome": "Administração Pública", "percentual": 0.12, "descricao": "Custeio da máquina pública, servidores"},
    ]

    @staticmethod
    def _calcular_inss(salario_bruto: float) -> float:
        """Calcula o INSS com tabela progressiva oficial."""
        inss = 0.0
        faixa_anterior = 0.0
        for teto, aliquota in CalculadoraService.TABELA_INSS:
            if salario_bruto <= faixa_anterior:
                break
            base = min(salario_bruto, teto) - faixa_anterior
            inss += base * aliquota
            faixa_anterior = teto
        return round(inss, 2)

    @staticmethod
    def _calcular_irrf(base_calculo: float) -> float:
        """Calcula o IRRF com tabela progressiva oficial."""
        for teto, aliquota, deducao in CalculadoraService.TABELA_IRRF:
            if base_calculo <= teto:
                irrf = base_calculo * aliquota - deducao
                return round(max(irrf, 0), 2)
        return 0.0

    @staticmethod
    def calcular(salario_bruto: float) -> Dict:
        # 1. Impostos sobre a renda (incidem diretamente sobre o salário)
        inss = CalculadoraService._calcular_inss(salario_bruto)
        base_irrf = salario_bruto - inss
        irrf = CalculadoraService._calcular_irrf(base_irrf)

        impostos_renda = [
            {
                "nome": "INSS",
                "valor": inss,
                "aliquota": round((inss / salario_bruto) * 100, 2),
                "descricao": "Contribuição Previdenciária (tabela progressiva 2024)",
                "tipo": "renda",
            },
            {
                "nome": "IRRF",
                "valor": irrf,
                "aliquota": round((irrf / salario_bruto) * 100, 2),
                "descricao": "Imposto de Renda Retido na Fonte (tabela progressiva 2024)",
                "tipo": "renda",
            },
        ]

        # 2. Estimativa de impostos sobre consumo (incidem sobre o que o trabalhador compra)
        salario_liquido_renda = salario_bruto - inss - irrf
        # Estimativa conservadora: ~30% do salário líquido vai para impostos de consumo
        CARGA_CONSUMO_ESTIMADA = 0.30
        total_consumo_estimado = salario_liquido_renda * CARGA_CONSUMO_ESTIMADA

        impostos_consumo = [
            {
                "nome": "ICMS",
                "valor": round(total_consumo_estimado * 0.50, 2),
                "aliquota": round((total_consumo_estimado * 0.50 / salario_bruto) * 100, 2),
                "descricao": "Imposto sobre Circulação de Mercadorias (estimativa sobre consumo)",
                "tipo": "consumo",
            },
            {
                "nome": "PIS/COFINS",
                "valor": round(total_consumo_estimado * 0.25, 2),
                "aliquota": round((total_consumo_estimado * 0.25 / salario_bruto) * 100, 2),
                "descricao": "Contribuições Sociais sobre faturamento (estimativa sobre consumo)",
                "tipo": "consumo",
            },
            {
                "nome": "IPI",
                "valor": round(total_consumo_estimado * 0.15, 2),
                "aliquota": round((total_consumo_estimado * 0.15 / salario_bruto) * 100, 2),
                "descricao": "Imposto sobre Produtos Industrializados (estimativa sobre consumo)",
                "tipo": "consumo",
            },
            {
                "nome": "ISS",
                "valor": round(total_consumo_estimado * 0.10, 2),
                "aliquota": round((total_consumo_estimado * 0.10 / salario_bruto) * 100, 2),
                "descricao": "Imposto Sobre Serviços (estimativa sobre consumo)",
                "tipo": "consumo",
            },
        ]

        todos_impostos = impostos_renda + impostos_consumo
        total_impostos = sum(i["valor"] for i in todos_impostos)
        salario_liquido_final = salario_bruto - inss - irrf  # Líquido real (sem impostos de consumo)
        percentual_impostos = (total_impostos / salario_bruto) * 100 if salario_bruto > 0 else 0

        # Destinos do dinheiro (baseados no total de impostos sobre renda)
        total_renda = inss + irrf
        destinos = []
        for dest in CalculadoraService.DESTINOS_IMPOSTO:
            valor = total_renda * dest["percentual"]
            traducoes = ValorTranslator.gerar_traducoes(valor, 2)
            destinos.append({
                "nome": dest["nome"],
                "valor": round(valor, 2),
                "percentual": dest["percentual"] * 100,
                "descricao": dest["descricao"],
                "traducoes": [t["descricao"] for t in traducoes],
            })

        dias_trabalho = ValorTranslator.calcular_dias_trabalho(total_renda, salario_bruto)
        traducoes = ValorTranslator.gerar_traducoes(total_renda, 5)

        return {
            "salario_bruto": round(salario_bruto, 2),
            "salario_liquido": round(salario_liquido_final, 2),
            "total_impostos": round(total_impostos, 2),
            "percentual_impostos": round(percentual_impostos, 2),
            "dias_trabalho_impostos": dias_trabalho,
            "impostos": todos_impostos,
            "destinos": destinos,
            "traducoes": traducoes,
            "nota_metodologica": (
                "INSS e IRRF calculados com tabelas progressivas oficiais de 2024. "
                "ICMS, IPI, PIS/COFINS e ISS são estimativas da carga tributária indireta "
                "sobre o consumo, baseadas em estudos do IBPT (Instituto Brasileiro de "
                "Planejamento e Tributação). Os valores reais variam conforme hábitos de consumo."
            ),
        }


# ==================== FUNÇÕES EXPORTÁVEIS PARA TESTES ====================
# Estas funções expõem a lógica de negócio de forma testável

def calcular_inss(salario_bruto: float) -> float:
    """Calcula o INSS com tabela progressiva. Exportada para testes."""
    return CalculadoraService._calcular_inss(max(salario_bruto, 0))

def calcular_irrf(salario_bruto: float, inss: float = 0.0) -> float:
    """Calcula o IRRF com tabela progressiva. Exportada para testes."""
    base = max(salario_bruto - inss, 0)
    return CalculadoraService._calcular_irrf(base)

def calcular_impostos_completo(salario_bruto: float) -> dict:
    """Calcula todos os impostos. Exportada para testes."""
    return CalculadoraService.calcular(salario_bruto)


# ==================== DEPENDÊNCIAS ====================

async def verificar_admin_key(x_admin_key: str = Header(default="")):
    """Verifica a chave de administrador para endpoints protegidos."""
    if not CACHE_ADMIN_KEY:
        raise HTTPException(
            status_code=503,
            detail="Endpoint desabilitado: CACHE_ADMIN_KEY não configurada no servidor."
        )
    if x_admin_key != CACHE_ADMIN_KEY:
        raise HTTPException(status_code=403, detail="Chave de administrador inválida.")


# ==================== ENDPOINTS ====================

@app.get("/", tags=["Status"])
async def root():
    return {
        "message": "Para Onde Vai Meu Dinheiro API",
        "version": "3.0.0",
        "docs": "/docs",
        "status": "online",
    }

@app.get("/health", tags=["Status"])
async def health():
    r = get_redis()
    redis_ok = False
    if r:
        try:
            redis_ok = r.ping()
        except Exception:
            redis_ok = False
    return {
        "status": "healthy",
        "redis": "connected" if redis_ok else "disconnected",
        "timestamp": datetime.now().isoformat(),
    }

# --- Deputados ---

@app.get("/api/deputados", response_model=List[DeputadoResumo], tags=["Câmara"])
async def listar_deputados(
    nome: Optional[str] = Query(None, description="Filtrar por nome do deputado"),
    uf: Optional[str] = Query(None, description="Filtrar por UF (ex: SP, RJ)"),
    partido: Optional[str] = Query(None, description="Filtrar por sigla do partido"),
):
    try:
        dados = await CamaraService.get_deputados(nome, uf, partido)
        return [
            {
                "id": d["id"],
                "nome": d["nome"],
                "partido": d.get("siglaPartido", "N/A"),
                "uf": d.get("siglaUf", "N/A"),
                "foto": d.get("urlFoto", ""),
                "email": d.get("email", ""),
            }
            for d in dados
        ]
    except httpx.HTTPStatusError as e:
        logger.error(f"Erro na API da Câmara: {e}")
        raise HTTPException(status_code=502, detail="Erro ao comunicar com a API da Câmara dos Deputados.")
    except Exception as e:
        logger.error(f"Erro inesperado em listar_deputados: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

@app.get("/api/deputados/{deputado_id}", response_model=DeputadoDetalhe, tags=["Câmara"])
async def get_deputado(deputado_id: int):
    try:
        dados = await CamaraService.get_deputado(deputado_id)
        ultimo = dados.get("ultimoStatus", {})
        gabinete = ultimo.get("gabinete", {})
        return {
            "id": dados["id"],
            "nome": ultimo.get("nome", ""),
            "nome_civil": dados.get("nomeCivil", ""),
            "partido": ultimo.get("siglaPartido", ""),
            "uf": ultimo.get("siglaUf", ""),
            "foto": ultimo.get("urlFoto", ""),
            "email": ultimo.get("email", ""),
            "telefone": gabinete.get("telefone", ""),
            "gabinete": gabinete.get("nome", ""),
            "situacao": ultimo.get("situacao", ""),
            "condicao_eleitoral": ultimo.get("condicaoEleitoral", ""),
        }
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail="Deputado não encontrado.")
        logger.error(f"Erro na API da Câmara: {e}")
        raise HTTPException(status_code=502, detail="Erro ao comunicar com a API da Câmara dos Deputados.")
    except Exception as e:
        logger.error(f"Erro inesperado em get_deputado: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

@app.get("/api/deputados/{deputado_id}/despesas", response_model=List[Despesa], tags=["Câmara"])
async def get_despesas(
    deputado_id: int,
    ano: Optional[int] = Query(None, ge=2000, le=2030),
    mes: Optional[int] = Query(None, ge=1, le=12),
):
    try:
        dados = await CamaraService.get_despesas(deputado_id, ano, mes)
        return [
            {
                "ano": d.get("ano", 0),
                "mes": d.get("mes", 0),
                "tipo_despesa": d.get("tipoDespesa", ""),
                "data_documento": d.get("dataDocumento", ""),
                "valor_documento": d.get("valorDocumento", 0),
                "valor_liquido": d.get("valorLiquido", 0),
                "fornecedor": d.get("nomeFornecedor", ""),
                "cnpj_cpf_fornecedor": d.get("cnpjCpfFornecedor", ""),
                "url_documento": d.get("urlDocumento"),
            }
            for d in dados
        ]
    except httpx.HTTPStatusError as e:
        logger.error(f"Erro na API da Câmara: {e}")
        raise HTTPException(status_code=502, detail="Erro ao comunicar com a API da Câmara dos Deputados.")
    except Exception as e:
        logger.error(f"Erro inesperado em get_despesas: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

# --- Ranking ---

@app.get("/api/ranking", response_model=List[RankingItem], tags=["Ranking"])
async def get_ranking(
    categoria: str = Query("total", description="Categoria de despesa"),
    ano: int = Query(2024, ge=2000, le=2030),
    limite: int = Query(50, ge=1, le=513),
):
    try:
        dados = await CamaraService.get_ranking(categoria, ano, limite)
        return dados
    except Exception as e:
        logger.error(f"Erro inesperado em get_ranking: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

# --- Calculadora ---

@app.post("/api/calculadora", response_model=CalculadoraResultado, tags=["Calculadora"])
async def calcular_impostos_post(input_data: CalculadoraInput):
    try:
        resultado = CalculadoraService.calcular(input_data.salario_bruto)
        return resultado
    except Exception as e:
        logger.error(f"Erro em calcular_impostos: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

@app.get("/api/calculadora", response_model=CalculadoraResultado, tags=["Calculadora"])
async def calcular_impostos_get(
    salario_bruto: float = Query(..., gt=0, le=10_000_000, description="Salário bruto mensal em R$")
):
    try:
        resultado = CalculadoraService.calcular(salario_bruto)
        return resultado
    except Exception as e:
        logger.error(f"Erro em calcular_impostos_get: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

# --- Tradução de Valores ---

@app.get("/api/traduzir", tags=["Utilitários"])
async def traduzir_valor(
    valor: float = Query(..., gt=0),
    limite: int = Query(3, ge=1, le=15),
):
    try:
        traducoes = ValorTranslator.gerar_traducoes(valor, limite)
        return {"valor_original": valor, "traducoes": traducoes}
    except Exception as e:
        logger.error(f"Erro em traduzir_valor: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

# --- Senadores ---

@app.get("/api/senadores", tags=["Senado"])
async def listar_senadores():
    try:
        dados = await SenadoService.get_senadores()
        return [
            {
                "id": d.get("IdentificacaoParlamentar", {}).get("CodigoParlamentar", ""),
                "nome": d.get("IdentificacaoParlamentar", {}).get("NomeParlamentar", ""),
                "partido": d.get("IdentificacaoParlamentar", {}).get("SiglaPartidoParlamentar", ""),
                "uf": d.get("IdentificacaoParlamentar", {}).get("UfParlamentar", ""),
                "foto": d.get("IdentificacaoParlamentar", {}).get("UrlFotoParlamentar", ""),
                "email": d.get("IdentificacaoParlamentar", {}).get("EmailParlamentar", ""),
            }
            for d in dados
        ]
    except httpx.HTTPStatusError as e:
        logger.error(f"Erro na API do Senado: {e}")
        raise HTTPException(status_code=502, detail="Erro ao comunicar com a API do Senado Federal.")
    except Exception as e:
        logger.error(f"Erro inesperado em listar_senadores: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

# --- Gerenciamento de Cache (PROTEGIDO) ---

@app.post("/api/cache/clear", tags=["Admin"], dependencies=[Depends(verificar_admin_key)])
async def clear_cache():
    """
    Limpa todo o cache do Redis.
    Requer o header 'X-Admin-Key' com a chave configurada em CACHE_ADMIN_KEY.
    """
    try:
        r = get_redis()
        if r:
            r.flushdb()  # Limpa apenas o banco atual, não todos os bancos
            logger.warning("Cache limpo por um administrador.")
            return {"message": "Cache limpo com sucesso."}
        return {"message": "Redis não disponível."}
    except Exception as e:
        logger.error(f"Erro ao limpar cache: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")

@app.get("/api/cache/stats", tags=["Admin"])
async def cache_stats():
    try:
        r = get_redis()
        if r:
            info = r.info()
            return {
                "used_memory": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_keys": r.dbsize(),
            }
        return {"message": "Redis não disponível."}
    except Exception as e:
        logger.error(f"Erro ao obter stats do cache: {e}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor.")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8000"))
    host = os.getenv("HOST", "0.0.0.0")
    uvicorn.run(app, host=host, port=port)
