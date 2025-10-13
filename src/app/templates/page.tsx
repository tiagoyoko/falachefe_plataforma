import { MessageSquare, Clock, Zap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function TemplatesPage() {
  const categorias = [
    {
      nome: "Vendas",
      icon: Zap,
      templates: [
        "Boas-vindas a novos clientes",
        "Acompanhamento de propostas",
        "Confirmação de pedidos",
        "Upsell e cross-sell"
      ]
    },
    {
      nome: "Suporte",
      icon: MessageSquare,
      templates: [
        "FAQ automatizado",
        "Abertura de tickets",
        "Status de atendimento",
        "Pesquisa de satisfação"
      ]
    },
    {
      nome: "Marketing",
      icon: CheckCircle,
      templates: [
        "Campanhas promocionais",
        "Lançamento de produtos",
        "Newsletter WhatsApp",
        "Eventos e webinars"
      ]
    },
    {
      nome: "Automação",
      icon: Clock,
      templates: [
        "Lembretes de pagamento",
        "Confirmação de agendamentos",
        "Notificações de entrega",
        "Alertas personalizados"
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
              <MessageSquare className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Templates WhatsApp
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Modelos prontos e personalizáveis para automatizar sua comunicação no WhatsApp
          </p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {categorias.map((categoria) => (
            <div key={categoria.nome} className="border rounded-lg p-6 hover:border-primary transition-all">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                  <categoria.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">{categoria.nome}</h3>
              </div>
              
              <ul className="space-y-2">
                {categoria.templates.map((template) => (
                  <li key={template} className="text-muted-foreground flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {template}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="bg-muted/50 rounded-lg p-8 mb-12">
          <h3 className="text-2xl font-bold mb-6 text-center">Recursos dos Templates</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Personalização</h4>
              <p className="text-sm text-muted-foreground">
                Adapte os templates com variáveis e dados do cliente
              </p>
            </div>
            <div className="text-center">
              <Clock className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">Agendamento</h4>
              <p className="text-sm text-muted-foreground">
                Envie mensagens no momento ideal
              </p>
            </div>
            <div className="text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h4 className="font-semibold mb-1">IA Integrada</h4>
              <p className="text-sm text-muted-foreground">
                Respostas inteligentes e contextual
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/signup">
              Começar a Usar Templates
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

