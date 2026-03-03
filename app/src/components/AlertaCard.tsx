import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, MapPin, Calendar, ExternalLink, TrendingUp } from 'lucide-react';
import { formatarMoeda } from '@/services/valorTranslator';
import { ValorInline, ListaTraducoes } from './ValorTraduzido';
import type { AlertaLicitacao } from '@/types';

interface AlertaCardProps {
  alerta: AlertaLicitacao;
  expandido?: boolean;
  onExpandir?: () => void;
}

export function AlertaCard({ alerta, expandido = false, onExpandir }: AlertaCardProps) {
  const getSeveridadeBadge = (diferenca: number) => {
    if (diferenca >= 100) return { label: 'CRÍTICO', cor: 'bg-red-600 text-white' };
    if (diferenca >= 50) return { label: 'ALTO', cor: 'bg-orange-500 text-white' };
    if (diferenca >= 30) return { label: 'MÉDIO', cor: 'bg-yellow-500 text-black' };
    return { label: 'BAIXO', cor: 'bg-blue-500 text-white' };
  };

  const severidade = getSeveridadeBadge(alerta.diferencaPercentual);
  const economiaPotencial = alerta.valorEstimado - alerta.valorMedioMercado;

  return (
    <Card className="border-l-4 border-l-red-500">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={severidade.cor}>
                <AlertTriangle className="w-3 h-3 mr-1" />
                {severidade.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {alerta.id}
              </Badge>
            </div>
            <CardTitle className="text-base">{alerta.orgao}</CardTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              <MapPin className="w-4 h-4" />
              {alerta.municipio}, {alerta.estado}
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-red-600 font-bold">
              <TrendingUp className="w-4 h-4" />
              +{alerta.diferencaPercentual.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">acima do mercado</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">{alerta.objeto}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 mb-1">Valor Estimado</p>
            <p className="font-bold text-red-700">{formatarMoeda(alerta.valorEstimado)}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 mb-1">Valor de Mercado</p>
            <p className="font-bold text-green-700">{formatarMoeda(alerta.valorMedioMercado)}</p>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 rounded-lg mb-4">
          <p className="text-xs text-yellow-700 mb-1">💸 Dinheiro que poderia ser economizado:</p>
          <p className="font-bold text-yellow-800">{formatarMoeda(economiaPotencial)}</p>
          <p className="text-sm text-yellow-700 mt-1">
            = <ValorInline valor={economiaPotencial} icone={false} />
          </p>
        </div>

        {expandido && (
          <div className="mb-4">
            <ListaTraducoes valor={economiaPotencial} limite={4} />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Abertura: {new Date(alerta.dataAbertura).toLocaleDateString('pt-BR')}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onExpandir}>
              {expandido ? 'Recolher' : 'Detalhes'}
            </Button>
            <Button size="sm" variant="default" asChild>
              <a href={alerta.link} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4 mr-1" />
                Ver licitação
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para lista de alertas
export function ListaAlertas({ 
  alertas, 
  carregando = false 
}: { 
  alertas: AlertaLicitacao[]; 
  carregando?: boolean;
}) {
  const [expandido, setExpandido] = useState<string | null>(null);

  if (carregando) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (alertas.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <div className="text-6xl mb-4">✅</div>
        <p className="text-lg font-medium">Nenhum alerta encontrado</p>
        <p className="text-sm">Não há licitações suspeitas para os filtros selecionados</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {alertas.map((alerta) => (
        <AlertaCard
          key={alerta.id}
          alerta={alerta}
          expandido={expandido === alerta.id}
          onExpandir={() => setExpandido(expandido === alerta.id ? null : alerta.id)}
        />
      ))}
    </div>
  );
}

import { useState } from 'react';
