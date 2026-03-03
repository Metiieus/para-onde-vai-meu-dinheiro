import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HeroSection } from '@/sections/HeroSection';
import { RankingSection } from '@/sections/RankingSection';
import { CalculadoraSection } from '@/sections/CalculadoraSection';
import { AlertasSection } from '@/sections/AlertasSection';
import { PerfilSection } from '@/sections/PerfilSection';
import { Toaster } from '@/components/ui/sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

type Tela = 'home' | 'ranking' | 'calculadora' | 'alertas' | 'perfil';

const TITULOS_TELA: Record<Tela, string> = {
  home: 'Para Onde Vai Meu Dinheiro — Transparência Pública',
  ranking: 'Ranking de Gastos — Para Onde Vai Meu Dinheiro',
  calculadora: 'Calculadora de Impostos — Para Onde Vai Meu Dinheiro',
  alertas: 'Alertas de Licitações — Para Onde Vai Meu Dinheiro',
  perfil: 'Perfil do Parlamentar — Para Onde Vai Meu Dinheiro',
};

// Componente de loading com tema Brasil
function LoadingScreen() {
  return (
    <motion.div
      className="fixed inset-0 bg-white z-50 flex items-center justify-center"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      role="status"
      aria-live="polite"
      aria-label="Carregando..."
    >
      <div className="text-center">
        <motion.div
          className="w-20 h-20 mx-auto mb-4 relative"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          aria-hidden="true"
        >
          <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 border-r-yellow-400" />
        </motion.div>
        <motion.p
          className="text-emerald-700 font-semibold"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Carregando...
        </motion.p>
        <p className="text-xs text-muted-foreground mt-2">🇧🇷 Transparência Pública</p>
      </div>
    </motion.div>
  );
}

function App() {
  const [telaAtual, setTelaAtual] = useState<Tela>('home');
  const [deputadoSelecionado, setDeputadoSelecionado] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Atualiza o título da página ao navegar (melhoria de SEO e acessibilidade)
  useEffect(() => {
    document.title = TITULOS_TELA[telaAtual];
  }, [telaAtual]);

  const navegarPara = (tela: Tela) => {
    setIsLoading(true);
    setTimeout(() => {
      setTelaAtual(tela);
      setIsLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 300);
  };

  const handleBuscarPolitico = (_nome: string) => {
    navegarPara('ranking');
  };

  const handleSelecionarPolitico = (id: number) => {
    setDeputadoSelecionado(id);
    navegarPara('perfil');
  };

  const renderTela = () => {
    switch (telaAtual) {
      case 'home':
        return (
          <HeroSection
            onBuscarPolitico={handleBuscarPolitico}
            onVerRanking={() => navegarPara('ranking')}
            onCalculadora={() => navegarPara('calculadora')}
            onAlertas={() => navegarPara('alertas')}
          />
        );
      case 'ranking':
        return (
          <RankingSection
            onVoltar={() => navegarPara('home')}
            onSelecionarPolitico={handleSelecionarPolitico}
          />
        );
      case 'calculadora':
        return (
          <CalculadoraSection
            onVoltar={() => navegarPara('home')}
          />
        );
      case 'alertas':
        return (
          <AlertasSection
            onVoltar={() => navegarPara('home')}
          />
        );
      case 'perfil':
        return deputadoSelecionado ? (
          <PerfilSection
            deputadoId={deputadoSelecionado}
            onVoltar={() => navegarPara('ranking')}
          />
        ) : (
          <RankingSection
            onVoltar={() => navegarPara('home')}
            onSelecionarPolitico={handleSelecionarPolitico}
          />
        );
      default:
        return (
          <HeroSection
            onBuscarPolitico={handleBuscarPolitico}
            onVerRanking={() => navegarPara('ranking')}
            onCalculadora={() => navegarPara('calculadora')}
            onAlertas={() => navegarPara('alertas')}
          />
        );
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background font-sans antialiased">
        <AnimatePresence>
          {isLoading && <LoadingScreen />}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={telaAtual}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Cada seção tem seu próprio ErrorBoundary para isolamento de falhas */}
            <ErrorBoundary>
              {renderTela()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>

        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'linear-gradient(135deg, #009739 0%, #00b845 100%)',
              color: 'white',
              border: 'none',
            },
          }}
        />
      </div>
    </ErrorBoundary>
  );
}

export default App;
