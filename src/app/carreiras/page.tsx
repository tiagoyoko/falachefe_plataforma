import { Briefcase, Sparkles, Users, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CarreirasPage() {
  const valores = [
    {
      titulo: "Inovação",
      descricao: "Estamos sempre buscando novas tecnologias e soluções criativas",
      icon: Sparkles
    },
    {
      titulo: "Colaboração",
      descricao: "Trabalhamos em equipe e valorizamos a contribuição de cada pessoa",
      icon: Users
    },
    {
      titulo: "Crescimento",
      descricao: "Investimos no desenvolvimento profissional e pessoal de nosso time",
      icon: TrendingUp
    }
  ]

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <Briefcase className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Carreiras no Falachefe
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Junte-se ao nosso time e ajude a revolucionar o atendimento ao cliente com IA
          </p>
        </div>

        {/* Valores */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">Nossos Valores</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {valores.map((valor) => (
              <div key={valor.titulo} className="text-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto mb-4">
                  <valor.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{valor.titulo}</h3>
                <p className="text-muted-foreground">{valor.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Benefícios */}
        <div className="bg-muted/50 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6">Benefícios</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Trabalho remoto flexível</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Horário flexível</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Plano de saúde</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Vale alimentação/refeição</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Auxílio home office</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Cursos e certificações</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Day off de aniversário</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
              <p>Stock options</p>
            </div>
          </div>
        </div>

        {/* Vagas */}
        <div className="border rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold mb-6">Vagas Abertas</h2>
          <p className="text-muted-foreground mb-6">
            No momento não temos vagas abertas, mas estamos sempre em busca de talentos excepcionais.
          </p>
          <p className="text-muted-foreground mb-6">
            Envie seu currículo e portfólio para <a href="mailto:carreiras@falachefe.com" className="text-primary hover:underline">carreiras@falachefe.com</a>
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="bg-muted/50 px-4 py-2 rounded-full text-sm">
              Desenvolvedor Full Stack
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-full text-sm">
              Engenheiro de IA/ML
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-full text-sm">
              Product Manager
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-full text-sm">
              Designer UI/UX
            </div>
            <div className="bg-muted/50 px-4 py-2 rounded-full text-sm">
              DevOps Engineer
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h3 className="text-2xl font-bold mb-4">Quer fazer parte do time?</h3>
          <p className="text-muted-foreground mb-6">
            Entre em contato conosco e descubra como você pode contribuir
          </p>
          <Button asChild size="lg">
            <Link href="/contato">
              Fale Conosco
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}

