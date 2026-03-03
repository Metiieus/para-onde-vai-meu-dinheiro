import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, SearchX, RefreshCw, WifiOff } from 'lucide-react';

// ==================== ESTADO DE ERRO ====================

interface EstadoErroProps {
  mensagem?: string;
  onTentarNovamente?: () => void;
  tipo?: 'rede' | 'generico';
}

/**
 * Componente para exibir um estado de erro amigável ao usuário.
 */
export function EstadoErro({
  mensagem = 'Não foi possível carregar os dados.',
  onTentarNovamente,
  tipo = 'generico',
}: EstadoErroProps) {
  const Icone = tipo === 'rede' ? WifiOff : AlertTriangle;
  const titulo = tipo === 'rede' ? 'Sem conexão com o servidor' : 'Erro ao carregar dados';

  return (
    <Card className="border-red-200 bg-red-50/50">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center">
          <Icone className="w-7 h-7 text-red-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="font-semibold text-red-700 mb-1">{titulo}</h3>
          <p className="text-sm text-red-600 max-w-sm">{mensagem}</p>
        </div>
        {onTentarNovamente && (
          <Button
            variant="outline"
            size="sm"
            onClick={onTentarNovamente}
            className="border-red-300 text-red-700 hover:bg-red-100"
          >
            <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
            Tentar novamente
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ==================== ESTADO VAZIO ====================

interface EstadoVazioProps {
  titulo?: string;
  descricao?: string;
  icone?: string;
  acao?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Componente para exibir um estado vazio (sem resultados).
 */
export function EstadoVazio({
  titulo = 'Nenhum resultado encontrado',
  descricao = 'Tente ajustar os filtros ou realizar uma nova busca.',
  icone = '🔍',
  acao,
}: EstadoVazioProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <div className="text-5xl" role="img" aria-label={titulo}>
          {icone}
        </div>
        <div>
          <h3 className="font-semibold text-slate-700 mb-1">{titulo}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">{descricao}</p>
        </div>
        {acao && (
          <Button variant="outline" size="sm" onClick={acao.onClick}>
            <SearchX className="w-4 h-4 mr-2" aria-hidden="true" />
            {acao.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
