import { Bot, MessageSquare, TrendingUp, Users, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function AgentesPage() {
  const agentes = [
    {
      nome: "LEO - Agente Financeiro",
      icon: DollarSign,
      descricao: "Especialista em gestão financeira, controle de despesas e análise de fluxo de caixa",
      funcionalidades: [
        "Registro de receitas e despesas",
        "Análise de fluxo de caixa",
        "Relatórios financeiros",
        "Alertas de pagamentos"
      ]
    },
    {
      nome: "MAX - Agente de Marketing & Vendas",
      icon: TrendingUp,
      descricao: "Especialista em marketing digital, campanhas e estratégias de vendas",
      funcionalidades: [
        "Criação de campanhas",
        "Análise de mercado",
        "Gestão de leads",
        "Métricas de conversão"
      ]
    },
    {
      nome: "LIA - Agente de RH",
      icon: Users,
      descricao: "Especialista em recursos humanos, gestão de colaboradores e processos",
      funcionalidades: [
        "Gestão de colaboradores",
        "Controle de ponto",
        "Benefícios e folha",
        "Recrutamento"
      ]
    }
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <Bot className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Agentes Inteligentes
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Conheça nossos agentes especializados de IA, prontos para automatizar e otimizar seus processos empresariais
          </p>
        </div>

        {/* Agentes Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {agentes.map((agente) => (
            <div key={agente.nome} className="border rounded-lg p-6 hover:border-primary transition-all hover:shadow-lg">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
                <agente.icon className="h-6 w-6 text-primary" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2">{agente.nome}</h3>
              <p className="text-muted-foreground mb-4">{agente.descricao}</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium">Funcionalidades:</p>
                <ul className="space-y-1">
                  {agente.funcionalidades.map((func) => (
                    <li key={func} className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {func}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <MessageSquare className="h-12 w-12 text-primary mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2">Pronto para começar?</h3>
          <p className="text-muted-foreground mb-6">
            Experimente nossos agentes gratuitamente e veja como eles podem transformar seu negócio
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Começar Agora
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/demo">
                Ver Demonstração
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

