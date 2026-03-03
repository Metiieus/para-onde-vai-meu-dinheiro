// Tipos para dados da Câmara dos Deputados
export interface Deputado {
  id: number;
  uri: string;
  nome: string;
  siglaPartido: string;
  uriPartido: string;
  siglaUf: string;
  idLegislatura: number;
  urlFoto: string;
  email: string;
}

export interface DespesaDeputado {
  ano: number;
  mes: number;
  tipoDespesa: string;
  codDocumento: number;
  tipoDocumento: string;
  codTipoDocumento: number;
  dataDocumento: string;
  numDocumento: string;
  valorDocumento: number;
  urlDocumento: string;
  nomeFornecedor: string;
  cnpjCpfFornecedor: string;
  valorLiquido: number;
  valorGlosa: number;
  numRessarcimento: string;
  codLote: number;
  parcela: number;
}

export interface DeputadoDetalhado extends Deputado {
  nomeCivil: string;
  cpf: string;
  sexo: string;
  urlWebsite: string;
  dataNascimento: string;
  dataFalecimento: string | null;
  ufNascimento: string;
  municipioNascimento: string;
  escolaridade: string;
  gabinete: {
    nome: string;
    predio: string;
    sala: string;
    andar: string;
    telefone: string;
    email: string;
  };
  situacaoNaLegislatura: {
    id: number;
    uri: string;
    nome: string;
    sigla: string;
  };
  ultimoStatus: {
    id: number;
    uri: string;
    nome: string;
    siglaPartido: string;
    uriPartido: string;
    siglaUf: string;
    idLegislatura: number;
    urlFoto: string;
    email: string;
    data: string;
    nomeEleitoral: string;
    gabinete: {
      nome: string;
      predio: string;
      sala: string;
      andar: string;
      telefone: string;
      email: string;
    };
    situacao: string;
    condicaoEleitoral: string;
    descricaoStatus: string | null;
  };
}

// Tipos para Senado Federal
export interface Senador {
  IdentificacaoParlamentar: {
    CodigoParlamentar: string;
    NomeParlamentar: string;
    NomeCompletoParlamentar: string;
    SexoParlamentar: string;
    FormaTratamento: string;
    UrlFotoParlamentar: string;
    UrlPaginaParlamentar: string;
    EmailParlamentar: string;
    SiglaPartidoParlamentar: string;
    UfParlamentar: string;
  };
}

// Tipos para Portal da Transparência
export interface DespesaGoverno {
  data: string;
  valor: number;
  orgao: string;
  programa: string;
  acao: string;
  favorecido: string;
  documentoFavorecido: string;
  tipoDespesa: string;
}

export interface Contrato {
  id: string;
  orgao: string;
  fornecedor: string;
  cnpjFornecedor: string;
  objeto: string;
  valorInicial: number;
  valorFinal: number;
  dataAssinatura: string;
  dataVigenciaInicio: string;
  dataVigenciaFim: string;
  situacao: string;
}

export interface Licitação {
  id: string;
  orgao: string;
  objeto: string;
  valorEstimado: number;
  valorContratado: number;
  dataPublicacao: string;
  dataAbertura: string;
  situacao: string;
  modalidade: string;
}

// Tipos para tradução de valores
export interface ComparacaoValor {
  valorOriginal: number;
  descricao: string;
  icone: string;
  cor: string;
}

// Tipos para o usuário
export interface PerfilUsuario {
  salarioMensal: number;
  estado: string;
  cidade: string;
}

// Tipos para ranking
export interface RankingItem {
  id: number;
  nome: string;
  partido: string;
  uf: string;
  foto: string;
  valorTotal: number;
  categoria: string;
  posicao: number;
  variacao?: number;
}

// Tipos para alertas
export interface AlertaLicitacao {
  id: string;
  orgao: string;
  municipio: string;
  estado: string;
  objeto: string;
  valorEstimado: number;
  valorMedioMercado: number;
  diferencaPercentual: number;
  dataAbertura: string;
  link: string;
}

// Tipos para tradução de gastos
export interface TraducaoGasto {
  valor: number;
  texto: string;
  icone: string;
  contexto: string;
}

// Categorias de despesa
export const CATEGORIAS_DESPESA = {
  MANUTENCAO: 'Manutenção de Escritório',
  COMBUSTIVEL: 'Combustíveis e Lubrificantes',
  PASSAGEM: 'Passagens Aéreas',
  TELEFONIA: 'Telefonia',
  CORREIO: 'Serviços Postais',
  ALIMENTACAO: 'Alimentação',
  HOSPEDAGEM: 'Hospedagem',
  DIVULGACAO: 'Divulgação da Atividade Parlamentar',
  CONSULTORIA: 'Consultorias e Assessorias',
  LOCACAO: 'Locação de Veículos',
  SEGURO: 'Segurança',
  OUTROS: 'Outros',
} as const;

export type CategoriaDespesa = typeof CATEGORIAS_DESPESA[keyof typeof CATEGORIAS_DESPESA];

// Tipos de comparação
export const TIPOS_COMPARACAO = {
  SALARIO_MINIMO: { nome: 'Salários Mínimos', valor: 1412, icone: '💼' },
  CESTA_BASICA: { nome: 'Cestas Básicas', valor: 250, icone: '🛒' },
  BOLSA_FAMILIA: { nome: 'Benefícios Bolsa Família', valor: 600, icone: '❤️' },
  PASSAGEM_ONIBUS: { nome: 'Passagens de Ônibus', valor: 4.5, icone: '🚌' },
  CADEIRA_RODAS: { nome: 'Cadeiras de Rodas', valor: 2500, icone: '♿' },
  NOTEBOOK: { nome: 'Notebooks', valor: 3500, icone: '💻' },
  CONSULTA_MEDICA: { nome: 'Consultas Médicas', valor: 200, icone: '🏥' },
  REMEDIO: { nome: 'Medicamentos Básicos', valor: 50, icone: '💊' },
  CRECHES: { nome: 'Vagas em Creches', valor: 800, icone: '👶' },
  UNIFORME_ESCOLAR: { nome: 'Uniformes Escolares', valor: 150, icone: '🎒' },
} as const;

export type TipoComparacao = keyof typeof TIPOS_COMPARACAO;
