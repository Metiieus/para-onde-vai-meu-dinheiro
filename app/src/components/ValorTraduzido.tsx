import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { traduzirValor, formatarMoeda, gerarTraducoes } from '@/services/valorTranslator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ValorTraduzidoProps {
  valor: number;
  titulo?: string;
  mostrarOriginal?: boolean;
  mostrarMultiplas?: boolean;
  limiteComparacoes?: number;
  tamanho?: 'sm' | 'md' | 'lg';
}

export function ValorTraduzido({
  valor,
  titulo,
  mostrarOriginal = true,
  mostrarMultiplas = false,
  limiteComparacoes = 3,
  tamanho = 'md',
}: ValorTraduzidoProps) {
  const traducaoPrincipal = useMemo(() => traduzirValor(valor), [valor]);
  const traducoesAdicionais = useMemo(() => 
    mostrarMultiplas ? gerarTraducoes(valor, limiteComparacoes) : [], 
    [valor, mostrarMultiplas, limiteComparacoes]
  );

  const tamanhoClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white">
        <CardHeader className="pb-2">
          {titulo && (
            <CardTitle className="text-sm font-medium text-slate-500">
              {titulo}
            </CardTitle>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{traducaoPrincipal.icone}</span>
            <div>
              {mostrarOriginal && (
                <p className={`font-semibold ${tamanhoClasses[tamanho]} text-emerald-600`}>
                  {formatarMoeda(valor)}
                </p>
              )}
              <p className="text-lg font-medium text-slate-600 mt-1">
                = {traducaoPrincipal.descricao}
              </p>
            </div>
          </div>

          {mostrarMultiplas && traducoesAdicionais.length > 1 && (
            <div className="mt-4 pt-3 border-t border-emerald-100">
              <p className="text-sm text-slate-400 mb-2">Outras comparações:</p>
              <div className="flex flex-wrap gap-2">
                {traducoesAdicionais.slice(1).map((traducao, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="text-xs py-1 px-2 bg-white border border-slate-100 text-slate-500"
                  >
                    <span className="mr-1">{traducao.icone}</span>
                    {traducao.descricao}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Componente simplificado para exibição inline
export function ValorInline({ valor, icone = true }: { valor: number; icone?: boolean }) {
  const traducao = useMemo(() => traduzirValor(valor), [valor]);

  return (
    <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
      {icone && <span>{traducao.icone}</span>}
      <span>{traducao.descricao}</span>
    </span>
  );
}

// Componente para lista de traduções
export function ListaTraducoes({ 
  valor, 
  limite = 5 
}: { 
  valor: number; 
  limite?: number 
}) {
  const traducoes = useMemo(() => gerarTraducoes(valor, limite), [valor, limite]);

  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-400 mb-3">
        Com <span className="font-medium text-emerald-600">{formatarMoeda(valor)}</span>, daria para:
      </p>
      <div className="grid grid-cols-1 gap-2">
        {traducoes.map((traducao, index) => (
          <motion.div 
            key={index}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-emerald-50 transition-colors"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <span className="text-xl">{traducao.icone}</span>
            <span className="font-medium text-slate-600">{traducao.descricao}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
