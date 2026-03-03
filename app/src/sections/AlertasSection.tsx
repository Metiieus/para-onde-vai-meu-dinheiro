import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ListaAlertas } from '@/components/AlertaCard';
import { ArrowLeft, Bell, MapPin, Filter, AlertTriangle, TrendingUp } from 'lucide-react';
import { useAlertas } from '@/hooks/useAlertas';
import { useUsuario } from '@/hooks/useUsuario';
import { formatarMoeda } from '@/services/valorTranslator';

interface AlertasSectionProps {
  onVoltar: () => void;
}

const ESTADOS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG',
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export function AlertasSection({ onVoltar }: AlertasSectionProps) {
  const {
    alertasFiltrados,
    loading,
    estadoSelecionado,
    cidadeSelecionada,
    limiteDiferenca,
    setEstadoSelecionado,
    setCidadeSelecionada,
    setLimiteDiferenca,
  } = useAlertas();

  const { cidade, estado, estaLogado } = useUsuario();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  // Estatísticas
  const totalAlertas = alertasFiltrados.length;
  const valorTotalSuspeito = alertasFiltrados.reduce((acc, a) => acc + a.valorEstimado, 0);
  const valorTotalEconomia = alertasFiltrados.reduce((acc, a) => 
    acc + (a.valorEstimado - a.valorMedioMercado), 0
  );
  const mediaDiferenca = totalAlertas > 0 
    ? alertasFiltrados.reduce((acc, a) => acc + a.diferencaPercentual, 0) / totalAlertas 
    : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onVoltar}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Alertas de Licitação
              </h1>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filtros */}
        {mostrarFiltros && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4" />
                    Estado
                  </Label>
                  <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os estados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      {ESTADOS.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="mb-2">Cidade</Label>
                  <Input
                    placeholder="Nome da cidade"
                    value={cidadeSelecionada}
                    onChange={(e) => setCidadeSelecionada(e.target.value)}
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4" />
                    Diferença mínima: {limiteDiferenca}%
                  </Label>
                  <Slider
                    value={[limiteDiferenca]}
                    onValueChange={(v) => setLimiteDiferenca(v[0])}
                    min={10}
                    max={100}
                    step={5}
                  />
                </div>
              </div>

              {estaLogado && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>Sua localização:</strong> {cidade}, {estado}
                  </p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-blue-600"
                    onClick={() => {
                      setEstadoSelecionado(estado);
                      setCidadeSelecionada(cidade);
                    }}
                  >
                    Usar minha localização
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Alertas</span>
              </div>
              <p className="text-2xl font-bold">{totalAlertas}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-orange-500" />
                <span className="text-xs text-muted-foreground">Diferença Média</span>
              </div>
              <p className="text-2xl font-bold">{mediaDiferenca.toFixed(1)}%</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Valor Suspeito</span>
              </div>
              <p className="text-2xl font-bold text-red-600">{formatarMoeda(valorTotalSuspeito)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Economia Potencial</span>
              </div>
              <p className="text-2xl font-bold text-green-600">{formatarMoeda(valorTotalEconomia)}</p>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Alertas */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <ListaAlertas alertas={alertasFiltrados} carregando={loading} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Como Funciona */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Como Funciona</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p>
                  <strong>1.</strong> Monitoramos licitações públicas em tempo real
                </p>
                <p>
                  <strong>2.</strong> Comparamos os valores com preços de mercado
                </p>
                <p>
                  <strong>3.</strong> Alertamos quando a diferença é significativa
                </p>
                <p>
                  <strong>4.</strong> Você pode acompanhar e denunciar
                </p>
              </CardContent>
            </Card>

            {/* Categorias de Risco */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Níveis de Alerta</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-600">CRÍTICO</Badge>
                  <span className="text-sm">Acima de 100%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-orange-500">ALTO</Badge>
                  <span className="text-sm">50% a 99%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-yellow-500 text-black">MÉDIO</Badge>
                  <span className="text-sm">30% a 49%</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-500">BAIXO</Badge>
                  <span className="text-sm">10% a 29%</span>
                </div>
              </CardContent>
            </Card>

            {/* Notificação */}
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <h4 className="font-medium mb-2">Receba Alertas</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Cadastre-se para receber notificações de licitações na sua cidade
                </p>
                <Button className="w-full" size="sm">
                  <Bell className="w-4 h-4 mr-2" />
                  Ativar Notificações
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
