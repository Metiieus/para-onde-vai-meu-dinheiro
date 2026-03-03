import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatarMoeda } from '@/services/valorTranslator';

interface DadoGrafico {
  label: string;
  valor: number;
  cor?: string;
}

interface GraficoBarrasProps {
  dados: DadoGrafico[];
  titulo?: string;
  altura?: number;
  mostrarValores?: boolean;
}

const CORES = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#fbbf24', // amber
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f43f5e', // rose
  '#14b8a6', // teal
  '#f97316', // orange
];

export function GraficoBarras({
  dados,
  titulo,
  altura = 200,
  mostrarValores = true,
}: GraficoBarrasProps) {
  const maximoValor = useMemo(() => 
    Math.max(...dados.map(d => d.valor), 1),
    [dados]
  );

  const dadosOrdenados = useMemo(() => 
    [...dados].sort((a, b) => b.valor - a.valor),
    [dados]
  );

  return (
    <Card className="border-slate-100">
      {titulo && (
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-base text-slate-600">{titulo}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="space-y-3" style={{ minHeight: altura }}>
          {dadosOrdenados.map((dado, index) => {
            const percentual = (dado.valor / maximoValor) * 100;
            const cor = dado.cor || CORES[index % CORES.length];

            return (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-600 truncate flex-1">{dado.label}</span>
                  {mostrarValores && (
                    <span className="text-slate-400 ml-2 text-xs">
                      {formatarMoeda(dado.valor)}
                    </span>
                  )}
                </div>
                <div className="relative h-6 bg-slate-100 rounded-full overflow-hidden">
                  <motion.div
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ backgroundColor: cor }}
                    initial={{ width: 0 }}
                    animate={{ width: `${percentual}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05 }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

interface GraficoPizzaProps {
  dados: DadoGrafico[];
  titulo?: string;
  tamanho?: number;
}

export function GraficoPizza({ dados, titulo, tamanho = 180 }: GraficoPizzaProps) {
  const total = useMemo(() => 
    dados.reduce((acc, d) => acc + d.valor, 0),
    [dados]
  );

  const dadosCalculados = useMemo(() => {
    let acumulado = 0;
    return dados.map((dado, index) => {
      const percentual = (dado.valor / total) * 100;
      const inicio = acumulado;
      acumulado += percentual;
      return {
        ...dado,
        percentual,
        inicio,
        fim: acumulado,
        cor: dado.cor || CORES[index % CORES.length],
      };
    });
  }, [dados, total]);

  return (
    <Card className="border-slate-100">
      {titulo && (
        <CardHeader className="bg-slate-50/50">
          <CardTitle className="text-base text-slate-600">{titulo}</CardTitle>
        </CardHeader>
      )}
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <svg width={tamanho} height={tamanho} viewBox="0 0 100 100">
            {dadosCalculados.map((dado, index) => {
              const inicioAngulo = (dado.inicio / 100) * 360;
              const fimAngulo = (dado.fim / 100) * 360;

              const x1 = 50 + 35 * Math.cos((inicioAngulo - 90) * Math.PI / 180);
              const y1 = 50 + 35 * Math.sin((inicioAngulo - 90) * Math.PI / 180);
              const x2 = 50 + 35 * Math.cos((fimAngulo - 90) * Math.PI / 180);
              const y2 = 50 + 35 * Math.sin((fimAngulo - 90) * Math.PI / 180);
              const largeArc = fimAngulo - inicioAngulo > 180 ? 1 : 0;

              return (
                <path
                  key={index}
                  d={`M 50 50 L ${x1} ${y1} A 35 35 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={dado.cor}
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
            <circle cx="50" cy="50" r="20" fill="white" />
            <text x="50" y="46" textAnchor="middle" className="text-[8px] fill-slate-400">
              Total
            </text>
            <text x="50" y="56" textAnchor="middle" className="text-[10px] font-semibold fill-slate-600">
              {formatarMoeda(total)}
            </text>
          </svg>

          <div className="flex-1 space-y-2">
            {dadosCalculados.map((dado, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: dado.cor }}
                />
                <span className="flex-1 truncate text-slate-600">{dado.label}</span>
                <span className="text-slate-400 text-xs">
                  {dado.percentual.toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
