import { BookOpen, Calendar, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function BlogPage() {
  const posts = [
    {
      titulo: "Como a IA está Transformando o Atendimento ao Cliente",
      resumo: "Descubra como agentes de IA podem revolucionar a experiência do cliente e aumentar a eficiência do seu negócio.",
      categoria: "Tecnologia",
      data: "15 de Outubro, 2025",
      autor: "Equipe Falachefe",
      tempo: "5 min"
    },
    {
      titulo: "WhatsApp Business: Guia Completo para Empresas",
      resumo: "Tudo que você precisa saber para usar o WhatsApp Business de forma profissional e estratégica.",
      categoria: "Marketing",
      data: "12 de Outubro, 2025",
      autor: "Equipe Falachefe",
      tempo: "8 min"
    },
    {
      titulo: "Automação de Vendas: 10 Dicas Práticas",
      resumo: "Aprenda a automatizar seu processo de vendas e fechar mais negócios com menos esforço.",
      categoria: "Vendas",
      data: "10 de Outubro, 2025",
      autor: "Equipe Falachefe",
      tempo: "6 min"
    },
    {
      titulo: "ROI de Chatbots: Como Medir o Retorno",
      resumo: "Métricas essenciais para avaliar o sucesso da sua estratégia de automação de atendimento.",
      categoria: "Analytics",
      data: "8 de Outubro, 2025",
      autor: "Equipe Falachefe",
      tempo: "7 min"
    },
    {
      titulo: "Tendências de IA para 2026",
      resumo: "O que esperar do futuro da inteligência artificial aplicada ao atendimento ao cliente.",
      categoria: "Tendências",
      data: "5 de Outubro, 2025",
      autor: "Equipe Falachefe",
      tempo: "10 min"
    },
    {
      titulo: "Cases de Sucesso: Empresas que Dobram Vendas com IA",
      resumo: "Histórias reais de empresas que transformaram seus resultados com automação inteligente.",
      categoria: "Cases",
      data: "1 de Outubro, 2025",
      autor: "Equipe Falachefe",
      tempo: "12 min"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <BookOpen className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Blog Falachefe
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Insights sobre IA, automação e tendências em atendimento ao cliente
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {posts.map((post, index) => (
            <article 
              key={index} 
              className="border rounded-lg overflow-hidden hover:border-primary transition-all hover:shadow-lg group"
            >
              <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <BookOpen className="h-16 w-16 text-primary/40" />
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full">
                    {post.categoria}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {post.tempo} de leitura
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors">
                  {post.titulo}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4">
                  {post.resumo}
                </p>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    {post.autor}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {post.data}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="bg-primary/5 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Receba nossos conteúdos</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Assine nossa newsletter e fique por dentro das novidades sobre IA, automação e WhatsApp Business
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Seu melhor e-mail" 
              className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <Button>
              Inscrever-se
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

