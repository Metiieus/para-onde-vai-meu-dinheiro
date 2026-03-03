/**
 * Serviço de API Centralizado
 *
 * MELHORIA CRÍTICA: Todas as chamadas de dados agora passam exclusivamente
 * pelo backend (BFF). O frontend não acessa mais as APIs governamentais diretamente,
 * eliminando o problema de N+1 queries e aproveitando o cache do servidor.
 */

// URL do backend configurável via variável de ambiente
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8000';

// ==================== CLIENTE HTTP BASE ====================

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly detail?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BACKEND_URL}${path}`;
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    let detail: string | undefined;
    try {
      const body = await response.json();
      detail = body?.detail;
    } catch {
      // Ignora erro ao parsear o corpo do erro
    }
    throw new ApiError(
      response.status,
      `Erro ${response.status} ao acessar ${path}`,
      detail
    );
  }

  return response.json() as Promise<T>;
}

// ==================== TIPOS ====================

export interface DeputadoResumo {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  email: string;
}

export interface DeputadoDetalhe {
  id: number;
  nome: string;
  nome_civil: string;
  partido: string;
  uf: string;
  foto: string;
  email: string;
  telefone: string;
  gabinete: string;
  situacao: string;
  condicao_eleitoral: string;
}

export interface Despesa {
  ano: number;
  mes: number;
  tipo_despesa: string;
  data_documento: string;
  valor_documento: number;
  valor_liquido: number;
  fornecedor: string;
  cnpj_cpf_fornecedor: string;
  url_documento?: string;
}

export interface RankingItemApi {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  valor_total: number;
  categoria: string;
  posicao: number;
}

export interface ResultadoCalculadora {
  salario_bruto: number;
  salario_liquido: number;
  total_impostos: number;
  percentual_impostos: number;
  dias_trabalho_impostos: number;
  impostos: Array<{
    nome: string;
    valor: number;
    aliquota: number;
    descricao: string;
    tipo: string;
  }>;
  destinos: Array<{
    nome: string;
    valor: number;
    percentual: number;
    descricao: string;
    traducoes: string[];
  }>;
  traducoes: Array<{
    valor_original: number;
    descricao: string;
    icone: string;
    cor: string;
  }>;
  nota_metodologica: string;
}

export interface TraducaoValor {
  valor_original: number;
  traducoes: Array<{
    valor_original: number;
    descricao: string;
    icone: string;
    cor: string;
  }>;
}

// ==================== FUNÇÕES DE API ====================

/**
 * Busca a lista de deputados, com filtros opcionais.
 */
export async function buscarDeputados(params?: {
  nome?: string;
  uf?: string;
  partido?: string;
}): Promise<DeputadoResumo[]> {
  const query = new URLSearchParams();
  if (params?.nome) query.set('nome', params.nome);
  if (params?.uf) query.set('uf', params.uf);
  if (params?.partido) query.set('partido', params.partido);
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<DeputadoResumo[]>(`/api/deputados${qs}`);
}

/**
 * Busca os detalhes de um deputado específico.
 */
export async function buscarDeputadoDetalhes(id: number): Promise<DeputadoDetalhe> {
  return apiFetch<DeputadoDetalhe>(`/api/deputados/${id}`);
}

/**
 * Busca as despesas de um deputado.
 */
export async function buscarDespesasDeputado(
  id: number,
  params?: { ano?: number; mes?: number }
): Promise<Despesa[]> {
  const query = new URLSearchParams();
  if (params?.ano) query.set('ano', String(params.ano));
  if (params?.mes) query.set('mes', String(params.mes));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<Despesa[]>(`/api/deputados/${id}/despesas${qs}`);
}

/**
 * Busca o ranking de gastos dos deputados.
 * O processamento pesado (N+1) é feito no servidor, aproveitando o cache.
 */
export async function buscarRanking(params?: {
  categoria?: string;
  ano?: number;
  limite?: number;
}): Promise<RankingItemApi[]> {
  const query = new URLSearchParams();
  if (params?.categoria) query.set('categoria', params.categoria);
  if (params?.ano) query.set('ano', String(params.ano));
  if (params?.limite) query.set('limite', String(params.limite));
  const qs = query.toString() ? `?${query.toString()}` : '';
  return apiFetch<RankingItemApi[]>(`/api/ranking${qs}`);
}

/**
 * Calcula os impostos para um dado salário bruto.
 * Utiliza a metodologia corrigida do backend com tabelas progressivas reais.
 */
export async function calcularImpostos(salarioBruto: number): Promise<ResultadoCalculadora> {
  return apiFetch<ResultadoCalculadora>(`/api/calculadora?salario_bruto=${salarioBruto}`);
}

/**
 * Traduz um valor monetário em comparações compreensíveis.
 */
export async function traduzirValorApi(valor: number, limite = 5): Promise<TraducaoValor> {
  return apiFetch<TraducaoValor>(`/api/traduzir?valor=${valor}&limite=${limite}`);
}

/**
 * Busca a lista de senadores.
 */
export async function buscarSenadores(): Promise<DeputadoResumo[]> {
  return apiFetch<DeputadoResumo[]>('/api/senadores');
}

export { ApiError };
