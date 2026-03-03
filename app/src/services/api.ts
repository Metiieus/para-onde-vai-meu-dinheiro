import axios from 'axios';

// Cliente para API da Câmara dos Deputados
export const apiCamara = axios.create({
  baseURL: 'https://dadosabertos.camara.leg.br/api/v2',
  headers: {
    'Accept': 'application/json',
  },
});

// Cliente para API do Senado Federal
export const apiSenado = axios.create({
  baseURL: 'https://legis.senado.leg.br/dadosabertos',
  headers: {
    'Accept': 'application/json',
  },
});

// Cliente para API do Portal da Transparência (requer token)
export const apiTransparencia = axios.create({
  baseURL: 'https://api.portaldatransparencia.gov.br/api-de-dados',
  headers: {
    'Accept': 'application/json',
  },
});

// Interceptor para adicionar token do Portal da Transparência
apiTransparencia.interceptors.request.use((config) => {
  const token = localStorage.getItem('transparencia_token');
  if (token) {
    config.headers['chave-api-dados'] = token;
  }
  return config;
});

// Função para buscar deputados
export const buscarDeputados = async (params?: { nome?: string; siglaUf?: string; siglaPartido?: string; idLegislatura?: number }) => {
  const response = await apiCamara.get('/deputados', { params });
  return response.data.dados || [];
};

// Função para buscar detalhes de um deputado
export const buscarDeputadoDetalhes = async (id: number) => {
  const response = await apiCamara.get(`/deputados/${id}`);
  return response.data.dados;
};

// Função para buscar despesas de um deputado
export const buscarDespesasDeputado = async (id: number, params?: { ano?: number; mes?: number; ordem?: string; ordenarPor?: string }) => {
  const response = await apiCamara.get(`/deputados/${id}/despesas`, { params });
  return response.data.dados || [];
};

// Função para buscar senadores
export const buscarSenadores = async () => {
  const response = await apiSenado.get('/senador/lista/atual');
  return response.data.ListaParlamentarEmExercicio?.Parlamentares?.Parlamentar || [];
};

// Função para buscar despesas de senador
export const buscarDespesasSenador = async (codigoSenador: string, ano: number) => {
  try {
    const response = await apiSenado.get(`/senador/${codigoSenador}/despesas/${ano}`);
    return response.data;
  } catch (error) {
    console.error('Erro ao buscar despesas do senador:', error);
    return null;
  }
};

// Função para buscar órgãos
export const buscarOrgaos = async () => {
  const response = await apiCamara.get('/orgaos');
  return response.data.dados || [];
};

// Função para buscar partidos
export const buscarPartidos = async () => {
  const response = await apiCamara.get('/partidos');
  return response.data.dados || [];
};

// Função para buscar legislaturas
export const buscarLegislaturas = async () => {
  const response = await apiCamara.get('/legislaturas');
  return response.data.dados || [];
};

// Função para buscar eventos
export const buscarEventos = async (params?: { dataInicio?: string; dataFim?: string }) => {
  const response = await apiCamara.get('/eventos', { params });
  return response.data.dados || [];
};

// Função para buscar proposições
export const buscarProposicoes = async (params?: { siglaTipo?: string; numero?: string; ano?: number; idDeputadoAutor?: number }) => {
  const response = await apiCamara.get('/proposicoes', { params });
  return response.data.dados || [];
};

// Função para buscar votações
export const buscarVotacoes = async (params?: { dataInicio?: string; dataFim?: string; idOrgao?: number }) => {
  const response = await apiCamara.get('/votacoes', { params });
  return response.data.dados || [];
};

// Função para buscar licitações da Câmara
export const buscarLicitacoesCamara = async (ano: number) => {
  try {
    const response = await apiCamara.get('/licitacoes', { params: { ano } });
    return response.data.dados || [];
  } catch (error) {
    console.error('Erro ao buscar licitações:', error);
    return [];
  }
};

// Função para buscar despesas do governo federal (Portal da Transparência)
export const buscarDespesasGoverno = async (params: { dataInicio: string; dataFim: string; pagina?: number }) => {
  try {
    const response = await apiTransparencia.get('/despesas/documentos', { params });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar despesas do governo:', error);
    return [];
  }
};

// Função para buscar contratos do governo federal
export const buscarContratosGoverno = async (params?: { dataInicial?: string; dataFinal?: string }) => {
  try {
    const response = await apiTransparencia.get('/contratos', { params });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar contratos:', error);
    return [];
  }
};

// Função para buscar convênios
export const buscarConvenios = async (params?: { dataInicial?: string; dataFinal?: string }) => {
  try {
    const response = await apiTransparencia.get('/convenios', { params });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar convênios:', error);
    return [];
  }
};

// Função para buscar viagens a serviço
export const buscarViagens = async (params?: { dataInicio?: string; dataFim?: string }) => {
  try {
    const response = await apiTransparencia.get('/viagens', { params });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar viagens:', error);
    return [];
  }
};

// Função para buscar CEIS (empresas inidôneas)
export const buscarCEIS = async () => {
  try {
    const response = await apiTransparencia.get('/ceis');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar CEIS:', error);
    return [];
  }
};

// Função para buscar CNEP (empresas punidas)
export const buscarCNEP = async () => {
  try {
    const response = await apiTransparencia.get('/cnep');
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar CNEP:', error);
    return [];
  }
};

// Função para buscar beneficiários de programas sociais
export const buscarBeneficiariosPrograma = async (programa: string, params: { codigoIbge?: string; pagina?: number }) => {
  try {
    const response = await apiTransparencia.get(`/${programa}-beneficiario-por-municipio`, { params });
    return response.data || [];
  } catch (error) {
    console.error(`Erro ao buscar beneficiários de ${programa}:`, error);
    return [];
  }
};

// Função para buscar servidor por nome
export const buscarServidor = async (nome: string) => {
  try {
    const response = await apiTransparencia.get('/servidores', { params: { nome } });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar servidor:', error);
    return [];
  }
};

// Função para buscar remuneração de servidor
export const buscarRemuneracaoServidor = async (idServidor: number, params?: { mes?: number; ano?: number }) => {
  try {
    const response = await apiTransparencia.get(`/servidores/${idServidor}/remuneracoes`, { params });
    return response.data || [];
  } catch (error) {
    console.error('Erro ao buscar remuneração:', error);
    return [];
  }
};
