import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { ValorInline } from './ValorTraduzido';
import { formatarMoeda } from '@/services/valorTranslator';
import { ChevronRight, MapPin, Users } from 'lucide-react';
import type { RankingItem } from '@/types';

interface CardPoliticoProps {
  politico: RankingItem;
  maximoValor?: number;
  onClick?: (id: number) => void;
  compacto?: boolean;
}

export function CardPolitico({ 
  politico, 
  maximoValor = 0, 
  onClick,
  compacto = false 
}: CardPoliticoProps) {
  const percentualDoMaximo = maximoValor > 0 
    ? (politico.valorTotal / maximoValor) * 100 
    : 0;

  const getPosicaoBadge = (posicao: number) => {
    if (posicao === 1) return '🥇';
    if (posicao === 2) return '🥈';
    if (posicao === 3) return '🥉';
    return `#${posicao}`;
  };

  if (compacto) {
    return (
      <motion.div 
        className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 bg-white hover:border-emerald-200 cursor-pointer transition-all"
        onClick={() => onClick?.(politico.id)}
        whileHover={{ scale: 1.01 }}
      >
        <span className="text-xl font-semibold w-8 text-center text-slate-400">
          {getPosicaoBadge(politico.posicao)}
        </span>
        
        <Avatar className="h-10 w-10 border border-slate-100">
          <AvatarImage src={politico.foto} alt={politico.nome} />
          <AvatarFallback className="bg-emerald-50 text-emerald-600 text-sm">
            {politico.nome.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-slate-700">{politico.nome}</p>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Badge variant="outline" className="text-xs border-slate-200 text-slate-500">
              {politico.partido}
            </Badge>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {politico.uf}
            </span>
          </div>
        </div>
        
        <div className="text-right">
          <p className="font-semibold text-rose-500">{formatarMoeda(politico.valorTotal)}</p>
          <ValorInline valor={politico.valorTotal} />
        </div>
        
        <ChevronRight className="w-5 h-5 text-slate-300" />
      </motion.div>
    );
  }

  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.2 }}>
      <Card className="border-slate-100 hover:border-emerald-200 hover:shadow-md transition-all">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="h-14 w-14 border border-slate-100">
                  <AvatarImage src={politico.foto} alt={politico.nome} />
                  <AvatarFallback className="bg-emerald-50 text-emerald-600">
                    {politico.nome.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-700 text-xs font-semibold rounded-full w-6 h-6 flex items-center justify-center">
                  {politico.posicao}
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-slate-700">{politico.nome}</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100">
                    {politico.partido}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1 border-slate-200 text-slate-500">
                    <MapPin className="w-3 h-3" />
                    {politico.uf}
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm text-slate-400">Total em despesas:</span>
                <span className="text-xl font-semibold text-rose-500">
                  {formatarMoeda(politico.valorTotal)}
                </span>
              </div>
              <Progress value={percentualDoMaximo} className="h-2 bg-slate-100" />
            </div>

            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-50">
              <span className="text-lg">💰</span>
              <span className="text-sm text-slate-500">
                Equivale a <ValorInline valor={politico.valorTotal} icone={false} />
              </span>
            </div>

            <Button 
              variant="outline" 
              className="w-full border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-600"
              onClick={() => onClick?.(politico.id)}
            >
              Ver detalhes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ListaPoliticos({ 
  politicos, 
  onSelecionar,
  carregando = false 
}: { 
  politicos: RankingItem[]; 
  onSelecionar?: (id: number) => void;
  carregando?: boolean;
}) {
  if (carregando) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-slate-50 rounded-xl skeleton" />
        ))}
      </div>
    );
  }

  if (politicos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-500">Nenhum político encontrado</p>
        <p className="text-sm text-slate-400">Tente ajustar os filtros</p>
      </div>
    );
  }

  const maximoValor = Math.max(...politicos.map(p => p.valorTotal));

  return (
    <div className="space-y-3">
      {politicos.map((politico, index) => (
        <motion.div
          key={politico.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.03 }}
        >
          <CardPolitico
            politico={politico}
            maximoValor={maximoValor}
            onClick={onSelecionar}
            compacto={true}
          />
        </motion.div>
      ))}
    </div>
  );
}
