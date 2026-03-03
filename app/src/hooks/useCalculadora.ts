import { useState, useCallback } from 'react';
import { calcularImpostos, ApiError, type ResultadoCalculadora } from '@/services/api';

interface ImpostoCalculado {
  nome: string;
  valor: number;
  aliquota: number;
  descricao: string;
  tipo: string;
}

interface DestinoCalculado {
  nome: string;
  valor: number;
  percentual: number;
  descricao: string;
  traducoes: string[];
}

interface UseCalculadoraReturn {
  salarioBruto: number;
  salarioLiquido: number;
  totalImpostos: number;
  percentualImpostos: number;
  impostos: ImpostoCalculado[];
  destinos: DestinoCalculado[];
  diasTrabalhoImpostos: number;
  notaMetodologica: string;
  loading: boolean;
  error: string | null;
  setSalarioBruto: (valor: number) => void;
  calcular: () => Promise<void>;
}

/**
 * Hook refatorado para a calculadora de impostos.
 *
 * MELHORIA CRÍTICA: O cálculo agora é feito pelo backend, que utiliza
 * tabelas progressivas reais do INSS e IRRF (2024), em vez de somar
 * alíquotas linearmente sobre o salário bruto.
 */
export const useCalculadora = (): UseCalculadoraReturn => {
  const [salarioBruto, setSalarioBruto] = useState<number>(5000);
  const [resultado, setResultado] = useState<ResultadoCalculadora | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calcular = useCallback(async () => {
    if (salarioBruto <= 0) {
      setError('O salário bruto deve ser um valor positivo.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dados = await calcularImpostos(salarioBruto);
      setResultado(dados);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Erro no cálculo: ${err.detail ?? err.message}`);
      } else {
        setError('Não foi possível calcular os impostos. Verifique sua conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  }, [salarioBruto]);

  return {
    salarioBruto,
    salarioLiquido: resultado?.salario_liquido ?? 0,
    totalImpostos: resultado?.total_impostos ?? 0,
    percentualImpostos: resultado?.percentual_impostos ?? 0,
    impostos: resultado?.impostos ?? [],
    destinos: resultado?.destinos ?? [],
    diasTrabalhoImpostos: resultado?.dias_trabalho_impostos ?? 0,
    notaMetodologica: resultado?.nota_metodologica ?? '',
    loading,
    error,
    setSalarioBruto,
    calcular,
  };
};
