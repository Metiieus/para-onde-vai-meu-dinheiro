import { useState, useEffect, useCallback } from 'react';
import type { PerfilUsuario } from '@/types';

interface UseUsuarioReturn {
  perfil: PerfilUsuario | null;
  salarioMensal: number;
  estado: string;
  cidade: string;
  estaLogado: boolean;
  setSalarioMensal: (valor: number) => void;
  setEstado: (estado: string) => void;
  setCidade: (cidade: string) => void;
  salvarPerfil: () => void;
  limparPerfil: () => void;
}

const STORAGE_KEY = 'imposto_real_perfil_usuario';

export const useUsuario = (): UseUsuarioReturn => {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);
  const [salarioMensal, setSalarioMensal] = useState<number>(3000);
  const [estado, setEstado] = useState<string>('');
  const [cidade, setCidade] = useState<string>('');
  const [estaLogado, setEstaLogado] = useState<boolean>(false);

  // Carrega perfil do localStorage ao inicializar
  useEffect(() => {
    const perfilSalvo = localStorage.getItem(STORAGE_KEY);
    if (perfilSalvo) {
      try {
        const perfilParsed = JSON.parse(perfilSalvo);
        setPerfil(perfilParsed);
        setSalarioMensal(perfilParsed.salarioMensal);
        setEstado(perfilParsed.estado);
        setCidade(perfilParsed.cidade);
        setEstaLogado(true);
      } catch (err) {
        console.error('Erro ao carregar perfil:', err);
      }
    }
  }, []);

  const salvarPerfil = useCallback(() => {
    const novoPerfil: PerfilUsuario = {
      salarioMensal,
      estado,
      cidade,
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novoPerfil));
    setPerfil(novoPerfil);
    setEstaLogado(true);
  }, [salarioMensal, estado, cidade]);

  const limparPerfil = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPerfil(null);
    setSalarioMensal(3000);
    setEstado('');
    setCidade('');
    setEstaLogado(false);
  }, []);

  return {
    perfil,
    salarioMensal,
    estado,
    cidade,
    estaLogado,
    setSalarioMensal,
    setEstado,
    setCidade,
    salvarPerfil,
    limparPerfil,
  };
};
