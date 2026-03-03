import { useState, useEffect, useCallback } from 'react';
import { buscarDeputados, buscarDeputadoDetalhes, buscarDespesasDeputado } from '@/services/api';
import type { Deputado, DeputadoDetalhado, DespesaDeputado } from '@/types';

interface UseDeputadosReturn {
  deputados: Deputado[];
  deputadoSelecionado: DeputadoDetalhado | null;
  despesas: DespesaDeputado[];
  loading: boolean;
  error: string | null;
  buscar: (params?: { nome?: string; siglaUf?: string; siglaPartido?: string }) => Promise<void>;
  selecionarDeputado: (id: number) => Promise<void>;
  carregarDespesas: (id: number, ano?: number) => Promise<void>;
}

export const useDeputados = (): UseDeputadosReturn => {
  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<DeputadoDetalhado | null>(null);
  const [despesas, setDespesas] = useState<DespesaDeputado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (params?: { nome?: string; siglaUf?: string; siglaPartido?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await buscarDeputados(params);
      setDeputados(dados);
    } catch (err) {
      setError('Erro ao buscar deputados');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const selecionarDeputado = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await buscarDeputadoDetalhes(id);
      setDeputadoSelecionado(dados);
    } catch (err) {
      setError('Erro ao buscar detalhes do deputado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarDespesas = useCallback(async (id: number, ano?: number) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await buscarDespesasDeputado(id, { ano, ordem: 'DESC', ordenarPor: 'dataDocumento' });
      setDespesas(dados);
    } catch (err) {
      setError('Erro ao buscar despesas do deputado');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega deputados ao inicializar
  useEffect(() => {
    buscar();
  }, [buscar]);

  return {
    deputados,
    deputadoSelecionado,
    despesas,
    loading,
    error,
    buscar,
    selecionarDeputado,
    carregarDespesas,
  };
};
