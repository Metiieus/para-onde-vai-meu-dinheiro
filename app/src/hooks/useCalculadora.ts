import { useState, useCallback, useMemo } from 'react';
import { gerarTraducoes, calcularDiasTrabalho } from '@/services/valorTranslator';

interface Imposto {
  nome: string;
  aliquota: number;
  descricao: string;
}

interface DestinoImposto {
  nome: string;
  percentual: number;
  descricao: string;
  exemplos: string[];
}

const IMPOSTOS_BRASIL: Imposto[] = [
  { nome: 'IRRF', aliquota: 0.275, descricao: 'Imposto de Renda Retido na Fonte (alíquota máxima)' },
  { nome: 'INSS', aliquota: 0.14, descricao: 'Instituto Nacional do Seguro Social (alíquota máxima)' },
  { nome: 'ISS', aliquota: 0.05, descricao: 'Imposto Sobre Serviços (média nacional)' },
  { nome: 'ICMS', aliquota: 0.18, descricao: 'Imposto sobre Circulação de Mercadorias e Serviços (média)' },
  { nome: 'IPI', aliquota: 0.10, descricao: 'Imposto sobre Produtos Industrializados (média)' },
  { nome: 'PIS/COFINS', aliquota: 0.0925, descricao: 'Programas de Integração Social e Contribuição para o Financiamento da Seguridade Social' },
];

const DESTINOS_IMPOSTO: DestinoImposto[] = [
  {
    nome: 'Saúde',
    percentual: 0.10,
    descricao: 'SUS, hospitais públicos, vacinas',
    exemplos: ['Construção de UPA', 'Compra de vacinas', 'Remédios gratuitos'],
  },
  {
    nome: 'Educação',
    percentual: 0.18,
    descricao: 'Escolas públicas, universidades, bolsas',
    exemplos: ['Merenda escolar', 'Material didático', 'Professor'],
  },
  {
    nome: 'Previdência',
    percentual: 0.35,
    descricao: 'Aposentadorias, pensões, BPC',
    exemplos: ['Aposentadoria INSS', 'Pensão por morte', 'BPC/LOAS'],
  },
  {
    nome: 'Segurança',
    percentual: 0.05,
    descricao: 'Polícia Federal, Polícia Rodoviária Federal',
    exemplos: ['Viaturas', 'Armamentos', 'Inteligência'],
  },
  {
    nome: 'Infraestrutura',
    percentual: 0.08,
    descricao: 'Rodovias, ferrovias, portos, aeroportos',
    exemplos: ['Manutenção de rodovias', 'Pontes', 'Obras'],
  },
  {
    nome: 'Assistência Social',
    percentual: 0.12,
    descricao: 'Bolsa Família, CREAS, abrigos',
    exemplos: ['Bolsa Família', 'Cestas básicas', 'Abrigos'],
  },
  {
    nome: 'Administração',
    percentual: 0.12,
    descricao: 'Custo da máquina pública',
    exemplos: ['Salários de servidores', 'Aluguel de prédios', 'Energia'],
  },
];

interface UseCalculadoraReturn {
  salarioBruto: number;
  salarioLiquido: number;
  totalImpostos: number;
  percentualImpostos: number;
  impostos: { nome: string; valor: number; descricao: string }[];
  destinos: { nome: string; valor: number; percentual: number; descricao: string; traducoes: string[] }[];
  traducoesTotais: { descricao: string; icone: string; cor: string }[];
  diasTrabalhoImpostos: number;
  setSalarioBruto: (valor: number) => void;
  calcular: () => void;
}

export const useCalculadora = (): UseCalculadoraReturn => {
  const [salarioBruto, setSalarioBruto] = useState<number>(5000);

  const calcularImpostos = useCallback(() => {
    const impostosCalculados = IMPOSTOS_BRASIL.map(imposto => ({
      nome: imposto.nome,
      valor: salarioBruto * imposto.aliquota,
      descricao: imposto.descricao,
    }));

    const totalImpostos = impostosCalculados.reduce((acc, imp) => acc + imp.valor, 0);
    const salarioLiquido = salarioBruto - totalImpostos;
    const percentualImpostos = (totalImpostos / salarioBruto) * 100;

    return {
      impostos: impostosCalculados,
      totalImpostos,
      salarioLiquido,
      percentualImpostos,
    };
  }, [salarioBruto]);

  const calcularDestinos = useCallback((totalImpostos: number) => {
    return DESTINOS_IMPOSTO.map(destino => {
      const valor = totalImpostos * destino.percentual;
      const traducoes = gerarTraducoes(valor, 3).map(t => t.descricao);
      
      return {
        nome: destino.nome,
        valor,
        percentual: destino.percentual * 100,
        descricao: destino.descricao,
        traducoes,
      };
    });
  }, []);

  const resultado = useMemo(() => {
    const { impostos, totalImpostos, salarioLiquido, percentualImpostos } = calcularImpostos();
    const destinos = calcularDestinos(totalImpostos);
    const traducoesTotais = gerarTraducoes(totalImpostos, 5);
    const diasTrabalhoImpostos = calcularDiasTrabalho(totalImpostos, salarioBruto);

    return {
      salarioLiquido,
      totalImpostos,
      percentualImpostos,
      impostos,
      destinos,
      traducoesTotais,
      diasTrabalhoImpostos,
    };
  }, [calcularImpostos, calcularDestinos, salarioBruto]);

  const calcular = useCallback(() => {
    // Calcula os valores (os hooks já fazem o cálculo automaticamente)
  }, []);

  return {
    salarioBruto,
    salarioLiquido: resultado.salarioLiquido,
    totalImpostos: resultado.totalImpostos,
    percentualImpostos: resultado.percentualImpostos,
    impostos: resultado.impostos,
    destinos: resultado.destinos,
    traducoesTotais: resultado.traducoesTotais,
    diasTrabalhoImpostos: resultado.diasTrabalhoImpostos,
    setSalarioBruto,
    calcular,
  };
};
