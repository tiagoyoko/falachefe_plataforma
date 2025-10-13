import { MessageSquare, Play, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <Play className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Experimente o Falachefe
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8">
            Veja como nossos agentes de IA podem transformar seu atendimento no WhatsApp
          </p>
        </div>

        {/* Demo Options */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <MessageSquare className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Chat Demonstração</h3>
            <p className="text-muted-foreground mb-4">
              Converse com nossos agentes de IA diretamente no navegador
            </p>
            <Button asChild className="w-full">
              <Link href="/chat">
                Iniciar Chat Demo
              </Link>
            </Button>
          </div>

          <div className="border rounded-lg p-6 hover:border-primary transition-colors">
            <Sparkles className="h-8 w-8 text-primary mb-4" />
            <h3 className="text-xl font-semibold mb-2">Tour Guiado</h3>
            <p className="text-muted-foreground mb-4">
              Conheça todos os recursos da plataforma
            </p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard">
                Ver Dashboard
              </Link>
            </Button>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-muted/50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">O que você pode testar:</h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Agentes especializados em vendas, marketing e suporte
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Respostas inteligentes baseadas em contexto
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Integração com WhatsApp
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
              Dashboard de métricas e conversas
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

