import type { ComparacaoValor, TraducaoGasto } from '@/types';

// Valor do salário mínimo atual (2024)
const SALARIO_MINIMO = 1412;

// Valores de referência para comparações
const VALORES_REFERENCIA = {
  SALARIO_MINIMO: { valor: 1412, nome: 'salários mínimos', icone: '💼', cor: 'blue' },
  CESTA_BASICA: { valor: 250, nome: 'cestas básicas', icone: '🛒', cor: 'green' },
  BOLSA_FAMILIA: { valor: 600, nome: 'benefícios do Bolsa Família', icone: '❤️', cor: 'red' },
  PASSAGEM_ONIBUS: { valor: 4.5, nome: 'passagens de ônibus', icone: '🚌', cor: 'yellow' },
  CADEIRA_RODAS: { valor: 2500, nome: 'cadeiras de rodas', icone: '♿', cor: 'purple' },
  NOTEBOOK: { valor: 3500, nome: 'notebooks', icone: '💻', cor: 'gray' },
  CONSULTA_MEDICA: { valor: 200, nome: 'consultas médicas particulares', icone: '🏥', cor: 'cyan' },
  REMEDIO: { valor: 50, nome: 'medicamentos básicos', icone: '💊', cor: 'pink' },
  CRECHES: { valor: 800, nome: 'vagas em creches', icone: '👶', cor: 'orange' },
  UNIFORME_ESCOLAR: { valor: 150, nome: 'uniformes escolares', icone: '🎒', cor: 'indigo' },
  LIVRO: { valor: 40, nome: 'livros didáticos', icone: '📚', cor: 'emerald' },
  MERENDA_ESCOLAR: { valor: 3, nome: 'refeições escolares', icone: '🍎', cor: 'lime' },
  INTERNET: { valor: 80, nome: 'meses de internet banda larga', icone: '🌐', cor: 'sky' },
  ENERGIA: { valor: 150, nome: 'meses de conta de energia', icone: '⚡', cor: 'amber' },
  AGUA: { valor: 50, nome: 'meses de conta de água', icone: '💧', cor: 'teal' },
};

// Função para formatar valor em reais
export const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
};

// Função para formatar número com separadores
export const formatarNumero = (valor: number, decimais: number = 0): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimais,
    maximumFractionDigits: decimais,
  }).format(valor);
};

// Função para traduzir valor em comparações
export const traduzirValor = (valor: number, tipo?: keyof typeof VALORES_REFERENCIA): ComparacaoValor => {
  if (tipo && VALORES_REFERENCIA[tipo]) {
    const ref = VALORES_REFERENCIA[tipo];
    const quantidade = Math.floor(valor / ref.valor);
    return {
      valorOriginal: valor,
      descricao: `${formatarNumero(quantidade)} ${ref.nome}`,
      icone: ref.icone,
      cor: ref.cor,
    };
  }

  // Seleciona a melhor comparação automaticamente
  const comparacoes = Object.entries(VALORES_REFERENCIA).map(([key, ref]) => {
    const quantidade = valor / ref.valor;
    return {
      key,
      quantidade,
      ref,
      relevancia: quantidade >= 1 && quantidade <= 1000 ? quantidade : 0,
    };
  }).filter(c => c.relevancia > 0);

  if (comparacoes.length === 0) {
    return {
      valorOriginal: valor,
      descricao: formatarMoeda(valor),
      icone: '💰',
      cor: 'green',
    };
  }

  // Ordena por relevância e pega a melhor
  comparacoes.sort((a, b) => b.relevancia - a.relevancia);
  const melhor = comparacoes[0];

  return {
    valorOriginal: valor,
    descricao: `${formatarNumero(Math.floor(melhor.quantidade))} ${melhor.ref.nome}`,
    icone: melhor.ref.icone,
    cor: melhor.ref.cor,
  };
};

// Função para gerar múltiplas traduções para um valor
export const gerarTraducoes = (valor: number, limite: number = 3): ComparacaoValor[] => {
  const traducoes: ComparacaoValor[] = [];

  Object.entries(VALORES_REFERENCIA).forEach(([, ref]) => {
    const quantidade = valor / ref.valor;
    if (quantidade >= 1) {
      traducoes.push({
        valorOriginal: valor,
        descricao: `${formatarNumero(Math.floor(quantidade))} ${ref.nome}`,
        icone: ref.icone,
        cor: ref.cor,
      });
    }
  });

  // Ordena por quantidade (mais relevante primeiro)
  traducoes.sort((a, b) => {
    const numA = parseFloat(a.descricao.split(' ')[0].replace('.', '').replace(',', '.'));
    const numB = parseFloat(b.descricao.split(' ')[0].replace('.', '').replace(',', '.'));
    return numB - numA;
  });

  return traducoes.slice(0, limite);
};

// Função para calcular dias de trabalho necessários
export const calcularDiasTrabalho = (valorGasto: number, salarioMensal: number): number => {
  const valorDiario = salarioMensal / 30;
  return Math.ceil(valorGasto / valorDiario);
};

// Função para calcular meses de trabalho necessários
export const calcularMesesTrabalho = (valorGasto: number, salarioMensal: number): number => {
  return valorGasto / salarioMensal;
};

// Função para gerar texto personalizado baseado no salário do usuário
export const gerarTextoPersonalizado = (valorGasto: number, salarioMensal: number, descricaoGasto: string): string => {
  const diasTrabalho = calcularDiasTrabalho(valorGasto, salarioMensal);
  const mesesTrabalho = calcularMesesTrabalho(valorGasto, salarioMensal);
  const percentualRenda = (valorGasto / salarioMensal) * 100;

  if (mesesTrabalho >= 1) {
    return `Baseado no seu salário de ${formatarMoeda(salarioMensal)}, você precisaria trabalhar ${formatarNumero(mesesTrabalho, 1)} meses (${diasTrabalho} dias) apenas para pagar ${descricaoGasto}. Isso representa ${formatarNumero(percentualRenda, 1)}% da sua renda anual.`;
  } else if (diasTrabalho >= 1) {
    return `Baseado no seu salário de ${formatarMoeda(salarioMensal)}, você trabalhou ${diasTrabalho} dias este mês apenas para pagar ${descricaoGasto}. Isso representa ${formatarNumero(percentualRenda, 1)}% da sua renda mensal.`;
  } else {
    const horasTrabalho = Math.ceil((valorGasto / (salarioMensal / 30 / 8)));
    return `Baseado no seu salário de ${formatarMoeda(salarioMensal)}, você trabalhou ${horasTrabalho} horas apenas para pagar ${descricaoGasto}.`;
  }
};

// Função para comparar com salário mínimo
export const compararComSalarioMinimo = (valor: number): string => {
  const quantidade = valor / SALARIO_MINIMO;
  if (quantidade >= 12) {
    const anos = quantidade / 12;
    return `${formatarNumero(anos, 1)} anos de salário mínimo`;
  } else if (quantidade >= 1) {
    return `${formatarNumero(quantidade, 1)} salários mínimos`;
  } else {
    return `${formatarNumero(quantidade * 100, 0)}% de um salário mínimo`;
  }
};

// Função para gerar contexto sobre o gasto
export const gerarContextoGasto = (valor: number, categoria?: string): string => {
  const traducoes = gerarTraducoes(valor, 2);
  
  let contexto = `Com ${formatarMoeda(valor)}, seria possível comprar `;
  
  if (traducoes.length >= 2) {
    contexto += `${traducoes[0].descricao.toLowerCase()} ou ${traducoes[1].descricao.toLowerCase()}.`;
  } else if (traducoes.length === 1) {
    contexto += `${traducoes[0].descricao.toLowerCase()}.`;
  } else {
    contexto = `Valor de ${formatarMoeda(valor)}.`;
  }

  if (categoria) {
    contexto += ` Gasto com ${categoria.toLowerCase()}.`;
  }

  return contexto;
};

// Função para gerar tradução completa de gasto
export const traduzirGastoCompleto = (
  valor: number,
  descricao: string,
  salarioUsuario?: number
): TraducaoGasto => {
  const traducoes = gerarTraducoes(valor, 3);
  const comparacaoSalarioMinimo = compararComSalarioMinimo(valor);
  
  let texto = `${formatarMoeda(valor)} equivalem a ${comparacaoSalarioMinimo}. `;
  
  if (traducoes.length > 0) {
    texto += `Isso daria para comprar ${traducoes.map(t => t.descricao).join(', ')}. `;
  }

  if (salarioUsuario) {
    texto += gerarTextoPersonalizado(valor, salarioUsuario, descricao);
  }

  return {
    valor,
    texto,
    icone: traducoes[0]?.icone || '💰',
    contexto: gerarContextoGasto(valor),
  };
};

// Função para calcular ranking de gastos
export const calcularRanking = (dados: { id: number; nome: string; valor: number }[]): { id: number; nome: string; valor: number; posicao: number }[] => {
  const ordenado = [...dados].sort((a, b) => b.valor - a.valor);
  return ordenado.map((item, index) => ({
    ...item,
    posicao: index + 1,
  }));
};

// Função para detectar anomalias em gastos
export const detectarAnomalias = (gastos: { valor: number; categoria: string; data: string }[]): { gasto: typeof gastos[0]; motivo: string; severidade: 'baixa' | 'media' | 'alta' }[] => {
  const anomalias: { gasto: typeof gastos[0]; motivo: string; severidade: 'baixa' | 'media' | 'alta' }[] = [];
  
  // Calcula média e desvio padrão
  const valores = gastos.map(g => g.valor);
  const media = valores.reduce((a, b) => a + b, 0) / valores.length;
  const desvioPadrao = Math.sqrt(valores.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / valores.length);
  
  gastos.forEach(gasto => {
    // Detecta valores muito acima da média
    if (gasto.valor > media + 3 * desvioPadrao) {
      anomalias.push({
        gasto,
        motivo: `Valor ${formatarNumero(gasto.valor / media, 1)}x acima da média`,
        severidade: 'alta',
      });
    } else if (gasto.valor > media + 2 * desvioPadrao) {
      anomalias.push({
        gasto,
        motivo: `Valor ${formatarNumero(gasto.valor / media, 1)}x acima da média`,
        severidade: 'media',
      });
    }
    
    // Detecta valores redondos suspeitos
    if (gasto.valor > 10000 && gasto.valor % 1000 === 0) {
      anomalias.push({
        gasto,
        motivo: 'Valor redondo significativo',
        severidade: 'baixa',
      });
    }
  });
  
  return anomalias;
};

// Função para agrupar gastos por categoria
export const agruparPorCategoria = (gastos: { valor: number; categoria: string }[]): { categoria: string; total: number; quantidade: number }[] => {
  const agrupado: Record<string, { total: number; quantidade: number }> = {};
  
  gastos.forEach(gasto => {
    if (!agrupado[gasto.categoria]) {
      agrupado[gasto.categoria] = { total: 0, quantidade: 0 };
    }
    agrupado[gasto.categoria].total += gasto.valor;
    agrupado[gasto.categoria].quantidade += 1;
  });
  
  return Object.entries(agrupado)
    .map(([categoria, dados]) => ({ categoria, ...dados }))
    .sort((a, b) => b.total - a.total);
};

// Função para calcular estatísticas de gastos
export const calcularEstatisticas = (gastos: number[]) => {
  if (gastos.length === 0) return null;
  
  const ordenado = [...gastos].sort((a, b) => a - b);
  const soma = gastos.reduce((a, b) => a + b, 0);
  const media = soma / gastos.length;
  const mediana = ordenado.length % 2 === 0
    ? (ordenado[ordenado.length / 2 - 1] + ordenado[ordenado.length / 2]) / 2
    : ordenado[Math.floor(ordenado.length / 2)];
  const minimo = ordenado[0];
  const maximo = ordenado[ordenado.length - 1];
  const desvioPadrao = Math.sqrt(gastos.reduce((sq, n) => sq + Math.pow(n - media, 2), 0) / gastos.length);
  
  return {
    total: soma,
    media,
    mediana,
    minimo,
    maximo,
    desvioPadrao,
    quantidade: gastos.length,
  };
};
