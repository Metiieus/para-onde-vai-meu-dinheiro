import { useState, useEffect, useCallback } from 'react';
import { buscarDeputados, buscarDespesasDeputado } from '@/services/api';
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

const CATEGORIAS_MAP: Record<string, string> = {
  'combustivel': 'Combustíveis e Lubrificantes',
  'passagem': 'Passagens Aéreas',
  'telefonia': 'Telefonia',
  'correio': 'Serviços Postais',
  'alimentacao': 'Alimentação',
  'hospedagem': 'Hospedagem',
  'divulgacao': 'Divulgação da Atividade Parlamentar',
  'consultoria': 'Consultorias e Assessorias',
  'manutencao': 'Manutenção de Escritório',
  'locacao': 'Locação de Veículos',
};

export const useRanking = (): UseRankingReturn => {
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoriaAtual, setCategoriaAtual] = useState<string>('total');
  const [ano, setAno] = useState<number>(2024);

  const carregarRanking = useCallback(async (categoria: string = 'total', anoSelecionado: number = 2024) => {
    setLoading(true);
    setError(null);
    
    try {
      // Busca todos os deputados
      const deputados = await buscarDeputados();
      
      // Limita a 50 deputados para não sobrecarregar a API
      const deputadosLimitados = deputados.slice(0, 50);
      
      const rankingData: RankingItem[] = [];
      
      // Para cada deputado, busca as despesas
      for (const deputado of deputadosLimitados) {
        try {
          const despesas = await buscarDespesasDeputado(deputado.id, { ano: anoSelecionado });
          
          let valorTotal = 0;
          
          if (categoria === 'total') {
            valorTotal = despesas.reduce((acc: number, d: { valorLiquido: number }) => acc + d.valorLiquido, 0);
          } else {
            const categoriaNome = CATEGORIAS_MAP[categoria];
            valorTotal = despesas
              .filter((d: { tipoDespesa?: string }) => d.tipoDespesa?.toLowerCase().includes(categoriaNome?.toLowerCase() || ''))
              .reduce((acc: number, d: { valorLiquido: number }) => acc + d.valorLiquido, 0);
          }
          
          if (valorTotal > 0) {
            rankingData.push({
              id: deputado.id,
              nome: deputado.nome,
              partido: deputado.siglaPartido,
              uf: deputado.siglaUf,
              foto: deputado.urlFoto,
              valorTotal,
              categoria,
              posicao: 0,
            });
          }
        } catch (err) {
          console.warn(`Erro ao buscar despesas do deputado ${deputado.id}:`, err);
        }
      }
      
      // Ordena por valor total (maior primeiro)
      rankingData.sort((a, b) => b.valorTotal - a.valorTotal);
      
      // Atualiza posições
      rankingData.forEach((item, index) => {
        item.posicao = index + 1;
      });
      
      setRanking(rankingData);
    } catch (err) {
      setError('Erro ao carregar ranking');
      console.error(err);
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
