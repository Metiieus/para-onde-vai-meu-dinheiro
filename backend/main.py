"""
Imposto Real - Backend API
FastAPI com Redis Cache para otimização de dados governamentais
"""

import os
import json
import asyncio
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from functools import wraps

import redis
import requests
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configuração Redis
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
CACHE_TTL = int(os.getenv("CACHE_TTL", "3600"))  # 1 hora padrão

# Configuração das APIs
CAMARA_API = "https://dadosabertos.camara.leg.br/api/v2"
SENADO_API = "https://legis.senado.leg.br/dadosabertos"
TRANSPARENCIA_API = "https://api.portaldatransparencia.gov.br/api-de-dados"

app = FastAPI(
    title="Imposto Real API",
    description="API para processamento e cache de dados governamentais brasileiros",
    version="2.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis client
redis_client = None

def get_redis():
    global redis_client
    if redis_client is None:
        try:
            redis_client = redis.from_url(REDIS_URL, decode_responses=True)
        except Exception as e:
            print(f"Redis não disponível: {e}")
            return None
    return redis_client

# Cache decorator
def cached(key_prefix: str, ttl: int = None):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            r = get_redis()
            if r is None:
                return await func(*args, **kwargs)
            
            cache_key = f"{key_prefix}:{hash(str(args) + str(kwargs))}"
            cached_data = r.get(cache_key)
            
            if cached_data:
                return json.loads(cached_data)
            
            result = await func(*args, **kwargs)
            r.setex(cache_key, ttl or CACHE_TTL, json.dumps(result))
            return result
        return wrapper
    return decorator

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
    url_documento: Optional[str]

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

class CalculadoraResultado(BaseModel):
    salario_bruto: float
    salario_liquido: float
    total_impostos: float
    percentual_impostos: float
    dias_trabalho_impostos: int
    impostos: List[Dict[str, Any]]
    destinos: List[Dict[str, Any]]
    traducoes: List[ComparacaoValor]

class AlertaLicitacao(BaseModel):
    id: str
    orgao: str
    municipio: str
    estado: str
    objeto: str
    valor_estimado: float
    valor_medio_mercado: float
    diferenca_percentual: float
    data_abertura: str
    severidade: str

# ==================== SERVIÇOS ====================

class CamaraService:
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
            
        response = requests.get(f"{CAMARA_API}/deputados", params=params, timeout=30)
        response.raise_for_status()
        return response.json().get("dados", [])
    
    @staticmethod
    @cached("deputado", 3600)
    async def get_deputado(deputado_id: int) -> Dict:
        response = requests.get(f"{CAMARA_API}/deputados/{deputado_id}", timeout=30)
        response.raise_for_status()
        return response.json().get("dados", {})
    
    @staticmethod
    @cached("despesas", 1800)
    async def get_despesas(deputado_id: int, ano: int = None, mes: int = None) -> List[Dict]:
        params = {}
        if ano:
            params["ano"] = ano
        if mes:
            params["mes"] = mes
        params["itens"] = 100
        params["ordem"] = "DESC"
        params["ordenarPor"] = "dataDocumento"
            
        response = requests.get(
            f"{CAMARA_API}/deputados/{deputado_id}/despesas", 
            params=params, 
            timeout=30
        )
        response.raise_for_status()
        return response.json().get("dados", [])
    
    @staticmethod
    async def get_ranking(categoria: str = "total", ano: int = 2024, limite: int = 50) -> List[Dict]:
        cache_key = f"ranking:{categoria}:{ano}:{limite}"
        r = get_redis()
        
        if r:
            cached = r.get(cache_key)
            if cached:
                return json.loads(cached)
        
        deputados = await CamaraService.get_deputados()
        deputados = deputados[:limite]
        
        ranking = []
        for dep in deputados:
            try:
                despesas = await CamaraService.get_despesas(dep["id"], ano)
                
                valor_total = 0
                if categoria == "total":
                    valor_total = sum(d.get("valorLiquido", 0) for d in despesas)
                else:
                    # Filtra por categoria
                    for d in despesas:
                        tipo = d.get("tipoDespesa", "").lower()
                        if categoria in tipo:
                            valor_total += d.get("valorLiquido", 0)
                
                if valor_total > 0:
                    ranking.append({
                        "id": dep["id"],
                        "nome": dep["nome"],
                        "partido": dep.get("siglaPartido", "N/A"),
                        "uf": dep.get("siglaUf", "N/A"),
                        "foto": dep.get("urlFoto", ""),
                        "valor_total": valor_total,
                        "categoria": categoria
                    })
            except Exception as e:
                print(f"Erro ao processar deputado {dep.get('id')}: {e}")
                continue
        
        ranking.sort(key=lambda x: x["valor_total"], reverse=True)
        
        for i, item in enumerate(ranking):
            item["posicao"] = i + 1
        
        if r:
            r.setex(cache_key, CACHE_TTL, json.dumps(ranking))
        
        return ranking

class SenadoService:
    @staticmethod
    @cached("senadores", 3600)
    async def get_senadores() -> List[Dict]:
        response = requests.get(f"{SENADO_API}/senador/lista/atual", timeout=30)
        response.raise_for_status()
        data = response.json()
        parlamentares = data.get("ListaParlamentarEmExercicio", {}).get("Parlamentares", {}).get("Parlamentar", [])
        return parlamentares if isinstance(parlamentares, list) else [parlamentares]

class ValorTranslator:
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
        melhor_comparacao = None
        melhor_relevancia = 0
        
        for key, ref in ValorTranslator.VALORES_REFERENCIA.items():
            quantidade = valor / ref["valor"]
            if 1 <= quantidade <= 10000:
                relevancia = quantidade
                if relevancia > melhor_relevancia:
                    melhor_relevancia = relevancia
                    melhor_comparacao = {
                        "valor_original": valor,
                        "descricao": f"{int(quantidade)} {ref['nome']}",
                        "icone": ref["icone"],
                        "cor": ref["cor"]
                    }
        
        return melhor_comparacao or {
            "valor_original": valor,
            "descricao": f"R$ {valor:,.2f}",
            "icone": "💰",
            "cor": "green"
        }
    
    @staticmethod
    def gerar_traducoes(valor: float, limite: int = 5) -> List[Dict]:
        traducoes = []
        for key, ref in ValorTranslator.VALORES_REFERENCIA.items():
            quantidade = valor / ref["valor"]
            if quantidade >= 1:
                traducoes.append({
                    "valor_original": valor,
                    "descricao": f"{int(quantidade)} {ref['nome']}",
                    "icone": ref["icone"],
                    "cor": ref["cor"]
                })
        
        traducoes.sort(key=lambda x: float(x["descricao"].split()[0]), reverse=True)
        return traducoes[:limite]
    
    @staticmethod
    def calcular_dias_trabalho(valor: float, salario_mensal: float) -> int:
        if salario_mensal <= 0:
            return 0
        valor_diario = salario_mensal / 30
        return int(valor / valor_diario)

class CalculadoraService:
    IMPOSTOS_BRASIL = [
        {"nome": "IRRF", "aliquota": 0.275, "descricao": "Imposto de Renda Retido na Fonte"},
        {"nome": "INSS", "aliquota": 0.14, "descricao": "Instituto Nacional do Seguro Social"},
        {"nome": "ISS", "aliquota": 0.05, "descricao": "Imposto Sobre Serviços"},
        {"nome": "ICMS", "aliquota": 0.18, "descricao": "Imposto sobre Circulação de Mercadorias"},
        {"nome": "IPI", "aliquota": 0.10, "descricao": "Imposto sobre Produtos Industrializados"},
        {"nome": "PIS/COFINS", "aliquota": 0.0925, "descricao": "Contribuições Sociais"},
    ]
    
    DESTINOS_IMPOSTO = [
        {"nome": "Saúde", "percentual": 0.10, "descricao": "SUS, hospitais públicos, vacinas"},
        {"nome": "Educação", "percentual": 0.18, "descricao": "Escolas públicas, universidades"},
        {"nome": "Previdência", "percentual": 0.35, "descricao": "Aposentadorias, pensões, BPC"},
        {"nome": "Segurança", "percentual": 0.05, "descricao": "Polícia Federal, PRF"},
        {"nome": "Infraestrutura", "percentual": 0.08, "descricao": "Rodovias, ferrovias, portos"},
        {"nome": "Assistência Social", "percentual": 0.12, "descricao": "Bolsa Família, CREAS"},
        {"nome": "Administração", "percentual": 0.12, "descricao": "Custo da máquina pública"},
    ]
    
    @staticmethod
    def calcular(salario_bruto: float) -> Dict:
        impostos = []
        for imp in CalculadoraService.IMPOSTOS_BRASIL:
            valor = salario_bruto * imp["aliquota"]
            impostos.append({
                "nome": imp["nome"],
                "valor": round(valor, 2),
                "aliquota": imp["aliquota"] * 100,
                "descricao": imp["descricao"]
            })
        
        total_impostos = sum(i["valor"] for i in impostos)
        salario_liquido = salario_bruto - total_impostos
        percentual_impostos = (total_impostos / salario_bruto) * 100 if salario_bruto > 0 else 0
        
        destinos = []
        for dest in CalculadoraService.DESTINOS_IMPOSTO:
            valor = total_impostos * dest["percentual"]
            traducoes = ValorTranslator.gerar_traducoes(valor, 2)
            destinos.append({
                "nome": dest["nome"],
                "valor": round(valor, 2),
                "percentual": dest["percentual"] * 100,
                "descricao": dest["descricao"],
                "traducoes": [t["descricao"] for t in traducoes]
            })
        
        dias_trabalho = ValorTranslator.calcular_dias_trabalho(total_impostos, salario_bruto)
        traducoes = ValorTranslator.gerar_traducoes(total_impostos, 5)
        
        return {
            "salario_bruto": round(salario_bruto, 2),
            "salario_liquido": round(salario_liquido, 2),
            "total_impostos": round(total_impostos, 2),
            "percentual_impostos": round(percentual_impostos, 2),
            "dias_trabalho_impostos": dias_trabalho,
            "impostos": impostos,
            "destinos": destinos,
            "traducoes": traducoes
        }

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    return {
        "message": "Imposto Real API",
        "version": "2.0.0",
        "docs": "/docs",
        "status": "online"
    }

@app.get("/health")
async def health():
    r = get_redis()
    return {
        "status": "healthy",
        "redis": "connected" if r and r.ping() else "disconnected",
        "timestamp": datetime.now().isoformat()
    }

# Deputados
@app.get("/api/deputados", response_model=List[DeputadoResumo])
async def listar_deputados(
    nome: Optional[str] = None,
    uf: Optional[str] = None,
    partido: Optional[str] = None
):
    try:
        dados = await CamaraService.get_deputados(nome, uf, partido)
        return [{
            "id": d["id"],
            "nome": d["nome"],
            "partido": d.get("siglaPartido", "N/A"),
            "uf": d.get("siglaUf", "N/A"),
            "foto": d.get("urlFoto", ""),
            "email": d.get("email", "")
        } for d in dados]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deputados/{deputado_id}", response_model=DeputadoDetalhe)
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
            "condicao_eleitoral": ultimo.get("condicaoEleitoral", "")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/deputados/{deputado_id}/despesas", response_model=List[Despesa])
async def get_despesas(
    deputado_id: int,
    ano: Optional[int] = None,
    mes: Optional[int] = None
):
    try:
        dados = await CamaraService.get_despesas(deputado_id, ano, mes)
        return [{
            "ano": d.get("ano", 0),
            "mes": d.get("mes", 0),
            "tipo_despesa": d.get("tipoDespesa", ""),
            "data_documento": d.get("dataDocumento", ""),
            "valor_documento": d.get("valorDocumento", 0),
            "valor_liquido": d.get("valorLiquido", 0),
            "fornecedor": d.get("nomeFornecedor", ""),
            "cnpj_cpf_fornecedor": d.get("cnpjCpfFornecedor", ""),
            "url_documento": d.get("urlDocumento")
        } for d in dados]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Ranking
@app.get("/api/ranking", response_model=List[RankingItem])
async def get_ranking(
    categoria: str = "total",
    ano: int = 2024,
    limite: int = 50
):
    try:
        dados = await CamaraService.get_ranking(categoria, ano, limite)
        return [{
            "id": d["id"],
            "nome": d["nome"],
            "partido": d["partido"],
            "uf": d["uf"],
            "foto": d["foto"],
            "valor_total": d["valor_total"],
            "categoria": d["categoria"],
            "posicao": d["posicao"]
        } for d in dados]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Calculadora
@app.post("/api/calculadora", response_model=CalculadoraResultado)
async def calcular_impostos(input: CalculadoraInput):
    try:
        resultado = CalculadoraService.calcular(input.salario_bruto)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/calculadora")
async def calcular_impostos_get(salario_bruto: float):
    try:
        resultado = CalculadoraService.calcular(salario_bruto)
        return resultado
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Tradução de valores
@app.get("/api/traduzir")
async def traduzir_valor(valor: float, limite: int = 3):
    try:
        traducoes = ValorTranslator.gerar_traducoes(valor, limite)
        return {
            "valor_original": valor,
            "traducoes": traducoes
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Senadores
@app.get("/api/senadores")
async def listar_senadores():
    try:
        dados = await SenadoService.get_senadores()
        return [{
            "id": d.get("IdentificacaoParlamentar", {}).get("CodigoParlamentar", ""),
            "nome": d.get("IdentificacaoParlamentar", {}).get("NomeParlamentar", ""),
            "partido": d.get("IdentificacaoParlamentar", {}).get("SiglaPartidoParlamentar", ""),
            "uf": d.get("IdentificacaoParlamentar", {}).get("UfParlamentar", ""),
            "foto": d.get("IdentificacaoParlamentar", {}).get("UrlFotoParlamentar", ""),
            "email": d.get("IdentificacaoParlamentar", {}).get("EmailParlamentar", "")
        } for d in dados]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Cache management
@app.post("/api/cache/clear")
async def clear_cache():
    try:
        r = get_redis()
        if r:
            r.flushall()
            return {"message": "Cache limpo com sucesso"}
        return {"message": "Redis não disponível"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/cache/stats")
async def cache_stats():
    try:
        r = get_redis()
        if r:
            info = r.info()
            return {
                "used_memory": info.get("used_memory_human", "N/A"),
                "connected_clients": info.get("connected_clients", 0),
                "total_keys": len(r.keys("*")) if r.keys("*") else 0
            }
        return {"message": "Redis não disponível"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
