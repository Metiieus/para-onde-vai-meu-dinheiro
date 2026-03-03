import { useState, useEffect, useCallback } from 'react';
import type { AlertaLicitacao } from '@/types';

// Dados simulados de licitações para demonstração
const LICITACOES_SIMULADAS: AlertaLicitacao[] = [
  {
    id: 'LIC-2024-001',
    orgao: 'Prefeitura Municipal de São Paulo',
    municipio: 'São Paulo',
    estado: 'SP',
    objeto: 'Aquisição de 500 computadores para rede municipal de ensino',
    valorEstimado: 2500000,
    valorMedioMercado: 1750000,
    diferencaPercentual: 42.8,
    dataAbertura: '2024-03-15',
    link: '#',
  },
  {
    id: 'LIC-2024-002',
    orgao: 'Secretaria de Saúde do Rio de Janeiro',
    municipio: 'Rio de Janeiro',
    estado: 'RJ',
    objeto: 'Contratação de serviços de limpeza hospitalar',
    valorEstimado: 4800000,
    valorMedioMercado: 3200000,
    diferencaPercentual: 50.0,
    dataAbertura: '2024-03-20',
    link: '#',
  },
  {
    id: 'LIC-2024-003',
    orgao: 'Prefeitura de Belo Horizonte',
    municipio: 'Belo Horizonte',
    estado: 'MG',
    objeto: 'Aquisição de 20 veículos tipo SUV para frota administrativa',
    valorEstimado: 3600000,
    valorMedioMercado: 2400000,
    diferencaPercentual: 50.0,
    dataAbertura: '2024-03-18',
    link: '#',
  },
  {
    id: 'LIC-2024-004',
    orgao: 'Secretaria de Educação de Curitiba',
    municipio: 'Curitiba',
    estado: 'PR',
    objeto: 'Reforma de 10 escolas municipais',
    valorEstimado: 8500000,
    valorMedioMercado: 5100000,
    diferencaPercentual: 66.6,
    dataAbertura: '2024-03-25',
    link: '#',
  },
  {
    id: 'LIC-2024-005',
    orgao: 'Prefeitura de Salvador',
    municipio: 'Salvador',
    estado: 'BA',
    objeto: 'Aquisição de material de expediente e escritório',
    valorEstimado: 850000,
    valorMedioMercado: 425000,
    diferencaPercentual: 100.0,
    dataAbertura: '2024-03-22',
    link: '#',
  },
];

interface UseAlertasReturn {
  alertas: AlertaLicitacao[];
  alertasFiltrados: AlertaLicitacao[];
  loading: boolean;
  error: string | null;
  estadoSelecionado: string;
  cidadeSelecionada: string;
  limiteDiferenca: number;
  setEstadoSelecionado: (estado: string) => void;
  setCidadeSelecionada: (cidade: string) => void;
  setLimiteDiferenca: (limite: number) => void;
  buscarAlertas: () => Promise<void>;
}

export const useAlertas = (): UseAlertasReturn => {
  const [alertas, setAlertas] = useState<AlertaLicitacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadoSelecionado, setEstadoSelecionado] = useState<string>('');
  const [cidadeSelecionada, setCidadeSelecionada] = useState<string>('');
  const [limiteDiferenca, setLimiteDiferenca] = useState<number>(30);

  const buscarAlertas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simula chamada à API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAlertas(LICITACOES_SIMULADAS);
    } catch (err) {
      setError('Erro ao buscar alertas de licitações');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const alertasFiltrados = alertas.filter(alerta => {
    if (estadoSelecionado && alerta.estado !== estadoSelecionado) return false;
    if (cidadeSelecionada && !alerta.municipio.toLowerCase().includes(cidadeSelecionada.toLowerCase())) return false;
    if (alerta.diferencaPercentual < limiteDiferenca) return false;
    return true;
  });

  useEffect(() => {
    buscarAlertas();
  }, [buscarAlertas]);

  return {
    alertas,
    alertasFiltrados,
    loading,
    error,
    estadoSelecionado,
    cidadeSelecionada,
    limiteDiferenca,
    setEstadoSelecionado,
    setCidadeSelecionada,
    setLimiteDiferenca,
    buscarAlertas,
  };
};
