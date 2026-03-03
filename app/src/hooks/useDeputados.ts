import { useState, useEffect, useCallback } from 'react';
import {
  buscarDeputados as apiBuscarDeputados,
  buscarDeputadoDetalhes,
  buscarDespesasDeputado as apiBuscarDespesas,
  ApiError,
} from '@/services/api';
import type { Deputado, DeputadoDetalhado, DespesaDeputado } from '@/types';

interface UseDeputadosReturn {
  deputados: Deputado[];
  deputadoSelecionado: DeputadoDetalhado | null;
  despesas: DespesaDeputado[];
  loading: boolean;
  error: string | null;
  buscar: (params?: { nome?: string; uf?: string; partido?: string }) => Promise<void>;
  selecionarDeputado: (id: number) => Promise<void>;
  carregarDespesas: (id: number, ano?: number) => Promise<void>;
}

/**
 * Hook refatorado para gerenciar dados de deputados.
 * Todas as chamadas passam pelo backend centralizado.
 */
export const useDeputados = (): UseDeputadosReturn => {
  const [deputados, setDeputados] = useState<Deputado[]>([]);
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<DeputadoDetalhado | null>(null);
  const [despesas, setDespesas] = useState<DespesaDeputado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = useCallback(async (params?: { nome?: string; uf?: string; partido?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await apiBuscarDeputados(params);
      // Mapeia snake_case da API para camelCase do frontend
      const deputadosMapeados: Deputado[] = dados.map(d => ({
        id: d.id,
        nome: d.nome,
        siglaPartido: d.partido,
        siglaUf: d.uf,
        urlFoto: d.foto,
        email: d.email,
      }));
      setDeputados(deputadosMapeados);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Erro ao buscar deputados: ${err.detail ?? err.message}`);
      } else {
        setError('Não foi possível carregar os deputados. Verifique sua conexão.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const selecionarDeputado = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await buscarDeputadoDetalhes(id);
      const detalhado: DeputadoDetalhado = {
        id: dados.id,
        nome: dados.nome,
        nomeCivil: dados.nome_civil,
        siglaPartido: dados.partido,
        siglaUf: dados.uf,
        urlFoto: dados.foto,
        email: dados.email,
        telefone: dados.telefone,
        gabinete: dados.gabinete,
        situacao: dados.situacao,
        condicaoEleitoral: dados.condicao_eleitoral,
      };
      setDeputadoSelecionado(detalhado);
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Deputado não encontrado.');
      } else if (err instanceof ApiError) {
        setError(`Erro ao buscar detalhes: ${err.detail ?? err.message}`);
      } else {
        setError('Não foi possível carregar os detalhes do deputado.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarDespesas = useCallback(async (id: number, ano?: number) => {
    setLoading(true);
    setError(null);
    try {
      const dados = await apiBuscarDespesas(id, { ano });
      const despesasMapeadas: DespesaDeputado[] = dados.map(d => ({
        ano: d.ano,
        mes: d.mes,
        tipoDespesa: d.tipo_despesa,
        dataDocumento: d.data_documento,
        valorDocumento: d.valor_documento,
        valorLiquido: d.valor_liquido,
        nomeFornecedor: d.fornecedor,
        cnpjCpfFornecedor: d.cnpj_cpf_fornecedor,
        urlDocumento: d.url_documento,
      }));
      setDespesas(despesasMapeadas);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Erro ao buscar despesas: ${err.detail ?? err.message}`);
      } else {
        setError('Não foi possível carregar as despesas do deputado.');
      }
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
