import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ValorTraduzido, ListaTraducoes, ValorInline } from '@/components/ValorTraduzido';
import { GraficoBarras } from '@/components/GraficoBarras';
import { ArrowLeft, MapPin, Mail, Phone, Building, Calendar, AlertTriangle, FileText, ExternalLink } from 'lucide-react';
import { useDeputados } from '@/hooks/useDeputados';
import { useUsuario } from '@/hooks/useUsuario';
import { formatarMoeda, agruparPorCategoria, detectarAnomalias } from '@/services/valorTranslator';

interface PerfilSectionProps {
  deputadoId: number;
  onVoltar: () => void;
}

export function PerfilSection({ deputadoId, onVoltar }: PerfilSectionProps) {
  const { 
    deputadoSelecionado, 
    despesas, 
    loading, 
    selecionarDeputado, 
    carregarDespesas 
  } = useDeputados();
  
  const { salarioMensal, estaLogado } = useUsuario();
  const [anoSelecionado] = useState(2024);

  useEffect(() => {
    selecionarDeputado(deputadoId);
    carregarDespesas(deputadoId, anoSelecionado);
  }, [deputadoId, anoSelecionado]);

  if (loading || !deputadoSelecionado) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const deputado = deputadoSelecionado;
  const ultimoStatus = deputado.ultimoStatus;

  // Calcula estatísticas das despesas
  const totalDespesas = despesas.reduce((acc, d) => acc + d.valorLiquido, 0);
  const mediaMensal = totalDespesas / 12;
  
  // Agrupa despesas por categoria
  const despesasPorCategoria = agruparPorCategoria(
    despesas.map(d => ({ valor: d.valorLiquido, categoria: d.tipoDespesa || 'Outros' }))
  );

  // Detecta anomalias
  const anomalias = detectarAnomalias(
    despesas.map(d => ({ valor: d.valorLiquido, categoria: d.tipoDespesa || 'Outros', data: d.dataDocumento }))
  );

  // Dados para gráfico
  const dadosGrafico = despesasPorCategoria.slice(0, 8).map(d => ({
    label: d.categoria.length > 25 ? d.categoria.substring(0, 25) + '...' : d.categoria,
    valor: d.total,
  }));

  // Top despesas
  const topDespesas = [...despesas]
    .sort((a, b) => b.valorLiquido - a.valorLiquido)
    .slice(0, 10);

  // Texto personalizado baseado no salário do usuário
  const textoPersonalizado = estaLogado 
    ? `Com seu salário de ${formatarMoeda(salarioMensal)}, você precisaria trabalhar ${Math.ceil(totalDespesas / salarioMensal)} meses para pagar as despesas deste deputado em ${anoSelecionado}.`
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onVoltar}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-bold text-lg">Perfil do Parlamentar</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Cabeçalho do Perfil */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={ultimoStatus.urlFoto} alt={ultimoStatus.nome} />
                  <AvatarFallback className="text-3xl">{ultimoStatus.nome.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
              </div>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">{ultimoStatus.nome}</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary" className="text-base">{ultimoStatus.siglaPartido}</Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {ultimoStatus.siglaUf}
                  </Badge>
                  <Badge variant="outline">{ultimoStatus.situacao}</Badge>
                  <Badge variant="outline">{ultimoStatus.condicaoEleitoral}</Badge>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  {ultimoStatus.gabinete.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-4 h-4" />
                      {ultimoStatus.gabinete.email}
                    </div>
                  )}
                  {ultimoStatus.gabinete.telefone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {ultimoStatus.gabinete.telefone}
                    </div>
                  )}
                  {ultimoStatus.gabinete.nome && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="w-4 h-4" />
                      Gabinete {ultimoStatus.gabinete.nome}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    Legislatura {deputado.idLegislatura}
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">Total em Despesas {anoSelecionado}</p>
                <p className="text-4xl font-bold text-red-600">{formatarMoeda(totalDespesas)}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Média mensal: {formatarMoeda(mediaMensal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Visual */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <ValorTraduzido
            valor={totalDespesas}
            titulo="Gastos do parlamentar traduzidos"
            mostrarMultiplas={true}
            tamanho="lg"
          />
          <ListaTraducoes valor={totalDespesas} limite={6} />
        </div>

        {textoPersonalizado && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <p className="text-blue-800">{textoPersonalizado}</p>
            </CardContent>
          </Card>
        )}

        {/* Tabs com detalhes */}
        <Tabs defaultValue="grafico" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="grafico">Gráfico</TabsTrigger>
            <TabsTrigger value="categorias">Categorias</TabsTrigger>
            <TabsTrigger value="despesas">Despesas</TabsTrigger>
            <TabsTrigger value="anomalias">
              Anomalias
              {anomalias.length > 0 && (
                <Badge variant="destructive" className="ml-2">{anomalias.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grafico" className="mt-6">
            <GraficoBarras
              dados={dadosGrafico}
              titulo={`Gastos por Categoria - ${anoSelecionado}`}
              altura={350}
            />
          </TabsContent>

          <TabsContent value="categorias" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Despesas por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {despesasPorCategoria.map((cat, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <p className="font-medium">{cat.categoria}</p>
                        <p className="text-sm text-muted-foreground">{cat.quantidade} documentos</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatarMoeda(cat.total)}</p>
                        <p className="text-sm text-muted-foreground">
                          <ValorInline valor={cat.total} icone={false} />
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="despesas" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Maiores Despesas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topDespesas.map((despesa, index) => (
                    <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{despesa.tipoDespesa}</p>
                        <p className="text-sm text-muted-foreground">
                          {despesa.nomeFornecedor}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(despesa.dataDocumento).toLocaleDateString('pt-BR')}
                          {despesa.numDocumento && (
                            <>
                              <span>•</span>
                              <FileText className="w-3 h-3" />
                              {despesa.numDocumento}
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{formatarMoeda(despesa.valorLiquido)}</p>
                        {despesa.urlDocumento && (
                          <a 
                            href={despesa.urlDocumento} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline flex items-center justify-end gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Ver comprovante
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anomalias" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Anomalias Detectadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {anomalias.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="text-4xl mb-2">✅</div>
                    <p>Nenhuma anomalia detectada nas despesas</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {anomalias.map((anomalia, index) => (
                      <div 
                        key={index} 
                        className={`p-4 rounded-lg border-l-4 ${
                          anomalia.severidade === 'alta' 
                            ? 'bg-red-50 border-red-500' 
                            : anomalia.severidade === 'media'
                            ? 'bg-orange-50 border-orange-500'
                            : 'bg-yellow-50 border-yellow-500'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{anomalia.gasto.categoria}</p>
                            <p className="text-sm text-muted-foreground">{anomalia.motivo}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">{formatarMoeda(anomalia.gasto.valor)}</p>
                            <Badge 
                              variant={anomalia.severidade === 'alta' ? 'destructive' : 'secondary'}
                            >
                              {anomalia.severidade.toUpperCase()}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Fonte:</strong> API Dados Abertos da Câmara dos Deputados.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              <strong>CEAP:</strong> Cota para Exercício da Atividade Parlamentar - verba destinada ao custeio das atividades parlamentares.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
