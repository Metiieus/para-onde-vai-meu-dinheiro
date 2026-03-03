import { useState, useEffect, useCallback } from 'react';
import { buscarRanking, ApiError } from '@/services/api';
import type { RankingItem } from '@/types';

interface UseRankingReturn {
  ranking: RankingItem[];
  loading: boolean;
  error: string | null;
  categoriaAtual: string;
  ano: number;
  carregarRanking: (categoria?: string, ano?: number) => Promise<void>;
  setCategoriaAtual: (categoria: string) => void;
  setAno: (ano: number) => void;
}

/**
 * Hook refatorado para buscar o ranking de gastos.
 *
 * MELHORIA CRÍTICA: Elimina o problema de N+1 queries. Agora faz uma única
 * chamada ao endpoint /api/ranking do backend, que processa os dados em
 * paralelo no servidor e os serve com cache.
 */
export const useRanking = (): UseRankingReturn => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriaAtual, setCategoriaAtual] = useState<string>('total');
  const [ano, setAno] = useState<number>(2024);

  const carregarRanking = useCallback(async (
    categoria: string = 'total',
    anoSelecionado: number = 2024
  ) => {
    setLoading(true);
    setError(null);

    try {
      const dados = await buscarRanking({ categoria, ano: anoSelecionado, limite: 50 });

      // Mapeia os dados da API (snake_case) para o tipo do frontend (camelCase)
      const rankingMapeado: RankingItem[] = dados.map(item => ({
        id: item.id,
        nome: item.nome,
        partido: item.partido,
        uf: item.uf,
        foto: item.foto,
        valorTotal: item.valor_total,
        categoria: item.categoria,
        posicao: item.posicao,
      }));

      setRanking(rankingMapeado);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Erro ao carregar ranking: ${err.detail ?? err.message}`);
      } else {
        setError('Não foi possível carregar o ranking. Verifique sua conexão e tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarRanking(categoriaAtual, ano);
  }, [carregarRanking, categoriaAtual, ano]);

  return {
    ranking,
    loading,
    error,
    categoriaAtual,
    ano,
    carregarRanking,
    setCategoriaAtual,
    setAno,
  };
};
