import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ValorTraduzido, ListaTraducoes } from '@/components/ValorTraduzido';
import { GraficoPizza } from '@/components/GraficoBarras';
import { EstadoErro } from '@/components/EstadoFeedback';
import {
  ArrowLeft,
  Calculator,
  Wallet,
  TrendingDown,
  Info,
  PiggyBank,
  Briefcase,
  Loader2,
} from 'lucide-react';
import { useCalculadora } from '@/hooks/useCalculadora';
import { useUsuario } from '@/hooks/useUsuario';
import { formatarMoeda } from '@/services/valorTranslator';

interface CalculadoraSectionProps {
  onVoltar: () => void;
}

export function CalculadoraSection({ onVoltar }: CalculadoraSectionProps) {
  const [salarioInput, setSalarioInput] = useState<string>('5000');
  const [mostrarResultado, setMostrarResultado] = useState(false);

  const {
    salarioBruto,
    salarioLiquido,
    totalImpostos,
    percentualImpostos,
    impostos,
    destinos,
    diasTrabalhoImpostos,
    notaMetodologica,
    loading,
    error,
    setSalarioBruto,
    calcular,
  } = useCalculadora();

  const { salvarPerfil, estaLogado } = useUsuario();

  const handleCalcular = async () => {
    const valor = parseFloat(salarioInput.replace(/[^0-9,]/g, '').replace(',', '.'));
    if (valor > 0 && valor <= 10_000_000) {
      setSalarioBruto(valor);
      await calcular();
      setMostrarResultado(true);
    }
  };

  const handleSalvar = () => {
    salvarPerfil();
  };

  // Dados para o gráfico de pizza
  const dadosGrafico = destinos.map(d => ({
    label: d.nome,
    valor: d.valor,
  }));

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoltar}
              aria-label="Voltar para a página inicial"
            >
              <ArrowLeft className="w-5 h-5" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="font-bold text-lg flex items-center gap-2">
                <Calculator className="w-5 h-5" aria-hidden="true" />
                Calculadora do Meu Imposto
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {!mostrarResultado ? (
          /* Tela de Input */
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div
                  className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <Wallet className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Qual é o seu salário bruto?</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Descubra quanto você paga de impostos e para onde esse dinheiro vai
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="salario">Salário Bruto Mensal (R$)</Label>
                  <Input
                    id="salario"
                    type="text"
                    placeholder="5.000,00"
                    value={salarioInput}
                    onChange={(e) => setSalarioInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCalcular()}
                    className="text-2xl font-bold text-center h-14"
                    aria-describedby="salario-hint"
                  />
                  <p id="salario-hint" className="text-xs text-muted-foreground mt-1 text-center">
                    Digite o valor bruto antes dos descontos
                  </p>
                </div>

                <div className="flex gap-2" role="group" aria-label="Valores de exemplo">
                  {[
                    { label: '1 Salário Mínimo', value: '1412' },
                    { label: 'R$ 3.000', value: '3000' },
                    { label: 'R$ 5.000', value: '5000' },
                    { label: 'R$ 10.000', value: '10000' },
                  ].map(({ label, value }) => (
                    <Button
                      key={value}
                      variant="outline"
                      className="flex-1 text-xs"
                      onClick={() => setSalarioInput(value)}
                      aria-label={`Usar ${label}`}
                    >
                      {label === '1 Salário Mínimo' ? '1 SM' : `R$ ${Number(value).toLocaleString('pt-BR')}`}
                    </Button>
                  ))}
                </div>

                <Button
                  onClick={handleCalcular}
                  className="w-full h-12 text-lg"
                  disabled={loading}
                  aria-busy={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
                      Calculando...
                    </>
                  ) : (
                    'Calcular Meu Imposto'
                  )}
                </Button>

                {error && (
                  <EstadoErro
                    mensagem={error}
                    onTentarNovamente={handleCalcular}
                  />
                )}

                <div className="text-center text-sm text-muted-foreground">
                  <Info className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Cálculo baseado nas tabelas progressivas oficiais de 2024
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Tela de Resultados */
          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-red-50 border-red-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6 text-red-600" aria-hidden="true" />
                    <span className="text-red-700 font-medium">Total em Impostos</span>
                  </div>
                  <p className="text-3xl font-bold text-red-700">{formatarMoeda(totalImpostos)}</p>
                  <p className="text-sm text-red-600 mt-1">
                    {percentualImpostos.toFixed(1)}% do seu salário
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <PiggyBank className="w-6 h-6 text-green-600" aria-hidden="true" />
                    <span className="text-green-700 font-medium">Seu Salário Líquido</span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{formatarMoeda(salarioLiquido)}</p>
                  <p className="text-sm text-green-600 mt-1">
                    {(100 - percentualImpostos).toFixed(1)}% do seu salário
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Briefcase className="w-6 h-6 text-blue-600" aria-hidden="true" />
                    <span className="text-blue-700 font-medium">Dias Trabalhados</span>
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{diasTrabalhoImpostos} dias</p>
                  <p className="text-sm text-blue-600 mt-1">
                    Apenas para pagar INSS e IR
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Nota Metodológica */}
            {notaMetodologica && (
              <Card className="bg-amber-50 border-amber-200">
                <CardContent className="p-4 flex gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <p className="text-sm text-amber-800">{notaMetodologica}</p>
                </CardContent>
              </Card>
            )}

            {/* Detalhes */}
            <Tabs defaultValue="destinos" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="destinos">Onde Vai Meu Dinheiro</TabsTrigger>
                <TabsTrigger value="impostos">Impostos Detalhados</TabsTrigger>
                <TabsTrigger value="traducao">Tradução do Valor</TabsTrigger>
              </TabsList>

              <TabsContent value="destinos" className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-6">
                  <GraficoPizza
                    dados={dadosGrafico}
                    titulo="Distribuição dos Seus Impostos"
                  />

                  <Card>
                    <CardHeader>
                      <CardTitle>Destino do Dinheiro</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {destinos.map((destino, index) => (
                          <div key={index}>
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{destino.nome}</span>
                                <Badge variant="secondary">{destino.percentual.toFixed(1)}%</Badge>
                              </div>
                              <span className="font-bold">{formatarMoeda(destino.valor)}</span>
                            </div>
                            <Progress value={destino.percentual} className="h-2" aria-label={`${destino.nome}: ${destino.percentual.toFixed(1)}%`} />
                            <p className="text-xs text-muted-foreground mt-1">
                              {destino.descricao}
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {destino.traducoes.slice(0, 2).map((t, i) => (
                                <span key={i} className="text-xs text-muted-foreground">
                                  = {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="impostos">
                <Card>
                  <CardHeader>
                    <CardTitle>Detalhamento dos Impostos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {impostos.map((imposto, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <p className="font-medium">{imposto.nome}</p>
                            <p className="text-sm text-muted-foreground">{imposto.descricao}</p>
                            {imposto.tipo === 'consumo' && (
                              <Badge variant="outline" className="text-xs mt-1">Estimativa sobre consumo</Badge>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatarMoeda(imposto.valor)}</p>
                            <p className="text-sm text-muted-foreground">
                              {imposto.aliquota.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="traducao">
                <div className="grid md:grid-cols-2 gap-6">
                  <ValorTraduzido
                    valor={totalImpostos}
                    titulo="Seus impostos em valores reais"
                    mostrarMultiplas={true}
                    tamanho="lg"
                  />
                  <ListaTraducoes valor={totalImpostos} limite={8} />
                </div>
              </TabsContent>
            </Tabs>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="outline" onClick={() => setMostrarResultado(false)}>
                Calcular Novamente
              </Button>
              {!estaLogado && (
                <Button onClick={handleSalvar}>
                  Salvar Meu Perfil
                </Button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
