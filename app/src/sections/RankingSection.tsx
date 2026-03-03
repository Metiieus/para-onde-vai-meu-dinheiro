import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ListaPoliticos } from '@/components/CardPolitico';
import { GraficoBarras } from '@/components/GraficoBarras';
import { EstadoErro, EstadoVazio } from '@/components/EstadoFeedback';
import { ArrowLeft, Filter, TrendingUp, Calendar, Trophy } from 'lucide-react';
import { useRanking } from '@/hooks/useRanking';
import { formatarMoeda } from '@/services/valorTranslator';

interface RankingSectionProps {
  onVoltar: () => void;
  onSelecionarPolitico: (id: number) => void;
}

const CATEGORIAS = [
  { id: 'total', nome: 'Total', icone: '💰' },
  { id: 'combustivel', nome: 'Combustível', icone: '⛽' },
  { id: 'passagem', nome: 'Passagens', icone: '✈️' },
  { id: 'telefonia', nome: 'Telefonia', icone: '📱' },
  { id: 'correio', nome: 'Correio', icone: '📮' },
  { id: 'alimentacao', nome: 'Alimentação', icone: '🍽️' },
  { id: 'hospedagem', nome: 'Hospedagem', icone: '🏨' },
  { id: 'divulgacao', nome: 'Divulgação', icone: '📢' },
  { id: 'consultoria', nome: 'Consultorias', icone: '👔' },
  { id: 'manutencao', nome: 'Manutenção', icone: '🔧' },
  { id: 'locacao', nome: 'Veículos', icone: '🚗' },
];

const ANOS = [2024, 2023, 2022, 2021, 2020];

export function RankingSection({ onVoltar, onSelecionarPolitico }: RankingSectionProps) {
  const {
    ranking,
    loading,
    error,
    categoriaAtual,
    ano,
    setCategoriaAtual,
    setAno,
    carregarRanking,
  } = useRanking();
  const [visualizacao, setVisualizacao] = useState<'lista' | 'grafico'>('lista');

  const categoriaInfo = CATEGORIAS.find(c => c.id === categoriaAtual);

  const dadosGrafico = ranking.slice(0, 10).map(p => ({
    label: p.nome.split(' ').slice(0, 2).join(' '),
    valor: p.valorTotal,
  }));

  const totalGasto = ranking.reduce((acc, p) => acc + p.valorTotal, 0);
  const mediaGasto = ranking.length > 0 ? totalGasto / ranking.length : 0;
  const maiorGasto = ranking.length > 0 ? ranking[0].valorTotal : 0;
  const menorGasto = ranking.length > 0 ? ranking[ranking.length - 1].valorTotal : 0;

  return (
    <div className="min-h-screen bg-white">
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoltar}
              className="hover:bg-slate-50"
              aria-label="Voltar para a página inicial"
            >
              <ArrowLeft className="w-5 h-5 text-slate-500" aria-hidden="true" />
            </Button>
            <div>
              <h1 className="font-semibold text-slate-700 flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" aria-hidden="true" />
                Ranking de Gastos
              </h1>
              <p className="text-xs text-slate-400">
                {categoriaInfo?.nome} — {ano}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6 border-slate-100 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label htmlFor="filtro-categoria" className="text-sm text-slate-500 mb-2 block">
                  <Filter className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Categoria
                </label>
                <Select value={categoriaAtual} onValueChange={setCategoriaAtual}>
                  <SelectTrigger id="filtro-categoria" className="border-slate-200">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icone} {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full md:w-40">
                <label htmlFor="filtro-ano" className="text-sm text-slate-500 mb-2 block">
                  <Calendar className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Ano
                </label>
                <Select value={ano.toString()} onValueChange={(v) => setAno(parseInt(v))}>
                  <SelectTrigger id="filtro-ano" className="border-slate-200">
                    <SelectValue placeholder="Ano" />
                  </SelectTrigger>
                  <SelectContent>
                    {ANOS.map(a => (
                      <SelectItem key={a} value={a.toString()}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Tabs
                  value={visualizacao}
                  onValueChange={(v) => setVisualizacao(v as 'lista' | 'grafico')}
                >
                  <TabsList className="bg-slate-100" aria-label="Modo de visualização">
                    <TabsTrigger value="lista">Lista</TabsTrigger>
                    <TabsTrigger value="grafico">Gráfico</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estado de Erro */}
        {error && !loading && (
          <div className="mb-6">
            <EstadoErro
              mensagem={error}
              onTentarNovamente={() => carregarRanking(categoriaAtual, ano)}
              tipo="rede"
            />
          </div>
        )}

        {/* Estatísticas */}
        {!error && (
          <div
            className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"
            aria-label="Estatísticas do ranking"
          >
            {[
              { label: 'Total', value: formatarMoeda(totalGasto), color: 'text-rose-500' },
              { label: 'Média', value: formatarMoeda(mediaGasto), color: 'text-blue-500' },
              { label: 'Maior', value: formatarMoeda(maiorGasto), color: 'text-rose-500' },
              { label: 'Menor', value: formatarMoeda(menorGasto), color: 'text-emerald-500' },
            ].map((stat) => (
              <Card key={stat.label} className="border-slate-100">
                <CardContent className="p-3">
                  <p className="text-xs text-slate-400 mb-1">{stat.label}</p>
                  <p className={`text-lg font-semibold ${stat.color}`}>{stat.value}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {visualizacao === 'lista' ? (
              <Card className="border-slate-100">
                <CardHeader className="bg-slate-50/50">
                  <CardTitle className="text-base text-slate-600 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                    Top Parlamentares
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  {!loading && !error && ranking.length === 0 ? (
                    <EstadoVazio
                      titulo="Nenhum dado encontrado"
                      descricao="Não foram encontrados gastos para esta categoria e ano. Tente selecionar outro filtro."
                      icone="📊"
                    />
                  ) : (
                    <ListaPoliticos
                      politicos={ranking.slice(0, 20)}
                      onSelecionar={onSelecionarPolitico}
                      carregando={loading}
                    />
                  )}
                </CardContent>
              </Card>
            ) : (
              ranking.length > 0 ? (
                <GraficoBarras
                  dados={dadosGrafico}
                  titulo={`Top 10 — ${categoriaInfo?.nome}`}
                  altura={350}
                />
              ) : (
                <EstadoVazio
                  titulo="Sem dados para o gráfico"
                  descricao="Selecione uma categoria com dados disponíveis."
                  icone="📊"
                />
              )
            )}
          </div>

          <div className="space-y-4">
            {/* Categorias */}
            <Card className="border-slate-100">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-slate-500">Categorias</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoria">
                  {CATEGORIAS.map(cat => (
                    <Badge
                      key={cat.id}
                      variant={categoriaAtual === cat.id ? 'default' : 'secondary'}
                      className={`cursor-pointer ${
                        categoriaAtual === cat.id
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                      onClick={() => setCategoriaAtual(cat.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === 'Enter' && setCategoriaAtual(cat.id)}
                      aria-pressed={categoriaAtual === cat.id}
                    >
                      {cat.icone} {cat.nome}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Destaques */}
            {ranking.length > 0 && (
              <Card className="border-slate-100">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-500">Destaques</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {ranking.slice(0, 3).map((politico, index) => (
                    <div key={politico.id} className="flex items-center gap-3">
                      <span
                        className="text-lg"
                        role="img"
                        aria-label={`${index + 1}º lugar`}
                      >
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-600">{politico.nome}</p>
                        <p className="text-xs text-slate-400">{politico.partido} — {politico.uf}</p>
                      </div>
                      <p className="text-sm font-semibold text-rose-500">
                        {formatarMoeda(politico.valorTotal)}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Fonte */}
            <Card className="bg-slate-50 border-slate-100">
              <CardContent className="p-4">
                <p className="text-xs text-slate-400">
                  <strong className="text-slate-500">Fonte:</strong> Câmara dos Deputados — API de Dados Abertos
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  <strong className="text-slate-500">CEAP:</strong> Cota para o Exercício da Atividade Parlamentar
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
