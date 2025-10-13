import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AnalyticsPage() {
  const metricas = [
    {
      nome: "Conversas",
      icon: MessageSquare,
      descricao: "Volume de conversas, tempo médio de resposta e taxa de resolução"
    },
    {
      nome: "Desempenho de Agentes",
      icon: TrendingUp,
      descricao: "Eficiência, precisão e satisfação por agente especializado"
    },
    {
      nome: "Engajamento",
      icon: Users,
      descricao: "Taxa de abertura, resposta e conversão de mensagens"
    },
    {
      nome: "Horários de Pico",
      icon: Clock,
      descricao: "Identificação de períodos com maior volume de atendimento"
    },
    {
      nome: "Metas e KPIs",
      icon: Target,
      descricao: "Acompanhamento de objetivos e indicadores de performance"
    },
    {
      nome: "ROI",
      icon: BarChart3,
      descricao: "Retorno sobre investimento e análise de custos vs. benefícios"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <BarChart3 className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Analytics & Métricas
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tome decisões baseadas em dados com dashboards inteligentes e relatórios detalhados
          </p>
        </div>

        {/* Métricas Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {metricas.map((metrica) => (
            <div key={metrica.nome} className="border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <metrica.icon className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="text-lg font-semibold mb-2">{metrica.nome}</h3>
              <p className="text-sm text-muted-foreground">{metrica.descricao}</p>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-primary/5 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6">Recursos do Analytics</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Dashboards em Tempo Real</h4>
                  <p className="text-sm text-muted-foreground">
                    Visualize métricas atualizadas instantaneamente
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Relatórios Customizáveis</h4>
                  <p className="text-sm text-muted-foreground">
                    Crie relatórios personalizados para suas necessidades
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Exportação de Dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Exporte para Excel, PDF ou integre com outras ferramentas
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 mt-0.5">
                  4
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Análise Preditiva</h4>
                  <p className="text-sm text-muted-foreground">
                    IA prevê tendências e sugere otimizações
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 mt-0.5">
                  5
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Alertas Inteligentes</h4>
                  <p className="text-sm text-muted-foreground">
                    Receba notificações de anomalias e oportunidades
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold flex-shrink-0 mt-0.5">
                  6
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Comparação Histórica</h4>
                  <p className="text-sm text-muted-foreground">
                    Compare períodos e identifique padrões
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Veja suas métricas em ação</h3>
          <p className="text-muted-foreground mb-6">
            Experimente nosso dashboard de analytics gratuitamente
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Começar Agora
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo">
                Ver Demo
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

