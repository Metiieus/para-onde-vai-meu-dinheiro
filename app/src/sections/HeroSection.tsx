import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ValorTraduzido, ListaTraducoes } from '@/components/ValorTraduzido';
import { Search, TrendingUp, AlertTriangle, Calculator, ArrowRight, Landmark } from 'lucide-react';
import { formatarMoeda } from '@/services/valorTranslator';

interface HeroSectionProps {
  onBuscarPolitico: (nome: string) => void;
  onVerRanking: () => void;
  onCalculadora: () => void;
  onAlertas: () => void;
}

const GASTO_EXEMPLO = 1250000;

function BolinhasDecorativas() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-20"
          style={{
            left: `${5 + i * 15}%`,
            top: `${10 + (i % 3) * 30}%`,
            width: 80 + i * 30,
            height: 80 + i * 30,
            background: i % 3 === 0 
              ? 'linear-gradient(135deg, #10b98130, transparent)' 
              : i % 3 === 1 
                ? 'linear-gradient(135deg, #fbbf2430, transparent)' 
                : 'linear-gradient(135deg, #3b82f630, transparent)',
          }}
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export function HeroSection({ onBuscarPolitico, onVerRanking, onCalculadora, onAlertas }: HeroSectionProps) {
  const [busca, setBusca] = useState('');

  const handleBuscar = () => {
    if (busca.trim()) {
      onBuscarPolitico(busca.trim());
    }
  };

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      <BolinhasDecorativas />
      
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-slate-100">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-lg text-slate-700">Imposto Real</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-1">
            {[
              { label: 'Ranking', onClick: onVerRanking },
              { label: 'Calculadora', onClick: onCalculadora },
              { label: 'Alertas', onClick: onAlertas },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.onClick}
                className="px-4 py-2 text-sm text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16 md:py-20 relative">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge className="mb-6 px-4 py-1.5 bg-emerald-50 text-emerald-600 border-emerald-100 font-medium">
              Dados públicos do governo federal
            </Badge>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold mb-6 text-slate-700 leading-tight"
          >
            Descubra para onde vai o <span className="text-emerald-500">seu dinheiro</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-slate-500 mb-10 max-w-xl mx-auto leading-relaxed"
          >
            Traduzimos os gastos públicos em valores que você entende. 
            Veja quantos <span className="text-emerald-600 font-medium">salários mínimos</span>, 
            <span className="text-amber-500 font-medium"> cestas básicas</span> e 
            <span className="text-blue-500 font-medium"> consultas médicas</span> poderiam ser comprados.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto mb-12"
          >
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar deputado ou senador..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                className="pl-12 h-12 rounded-xl border-2 border-slate-100 bg-white focus:border-emerald-300 text-slate-600"
              />
            </div>
            <Button 
              onClick={handleBuscar} 
              className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-medium"
            >
              Buscar
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>

          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            {[
              { value: '513', label: 'Deputados', color: 'text-emerald-500' },
              { value: '81', label: 'Senadores', color: 'text-amber-500' },
              { value: 'R$ 8.6B', label: 'Em despesas', color: 'text-blue-500' },
              { value: 'CEAP', label: 'Cota parlamentar', color: 'text-emerald-500' },
            ].map((stat) => (
              <Card key={stat.label} className="border-slate-100 shadow-sm">
                <CardContent className="p-4">
                  <div className={`text-2xl font-semibold ${stat.color}`}>{stat.value}</div>
                  <div className="text-xs text-slate-400">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>

        <motion.div 
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <h2 className="text-xl font-medium text-center mb-8 text-slate-600">
            Exemplo: Um gasto de <span className="text-emerald-500 font-semibold">{formatarMoeda(GASTO_EXEMPLO)}</span>
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <ValorTraduzido valor={GASTO_EXEMPLO} titulo="Valor traduzido" mostrarMultiplas={true} tamanho="lg" />
            <ListaTraducoes valor={GASTO_EXEMPLO} limite={6} />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Ranking de Gastos', desc: 'Veja quem gasta mais em cada categoria', icon: TrendingUp, onClick: onVerRanking, color: 'bg-blue-500' },
              { title: 'Calculadora do Imposto', desc: 'Descubra onde seu dinheiro é gasto', icon: Calculator, onClick: onCalculadora, color: 'bg-emerald-500' },
              { title: 'Alertas de Licitação', desc: 'Licitações com valores acima do mercado', icon: AlertTriangle, onClick: onAlertas, color: 'bg-amber-400' },
            ].map((action) => (
              <Card 
                key={action.title}
                className="cursor-pointer h-full border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all"
                onClick={action.onClick}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mb-4`}>
                    <action.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-medium text-slate-700 mb-1">{action.title}</h3>
                  <p className="text-sm text-slate-400">{action.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-100 mt-20 py-8 bg-slate-50/50">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-slate-400">
            Dados de fontes oficiais: Câmara dos Deputados, Senado Federal, Portal da Transparência
          </p>
          <p className="text-xs text-slate-300 mt-2">© 2024 - Projeto de transparência pública</p>
        </div>
      </footer>
    </div>
  );
}
