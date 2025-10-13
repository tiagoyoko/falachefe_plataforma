import { Metadata } from "next";
import { Bot, BarChart3, Shield, Zap, Users, Target, Headphones } from "lucide-react";

export const metadata: Metadata = {
  title: "Soluções - Falachefe para seu Negócio",
  description: "Descubra como o Falachefe pode automatizar vendas, marketing e suporte da sua empresa com agentes de IA especializados via WhatsApp.",
};

export default function SolucoesPage() {
  const solutions = [
    {
      icon: Target,
      title: "Vendas Automatizadas",
      description: "Agentes especializados em vendas que qualificam leads, apresentam produtos e fecham negócios 24/7.",
      features: [
        "Qualificação automática de leads",
        "Apresentação de produtos personalizada",
        "Follow-up inteligente de vendas",
        "Integração com CRM existente"
      ]
    },
    {
      icon: Users,
      title: "Marketing Inteligente",
      description: "Campanhas de marketing automatizadas que engajam clientes e aumentam conversões.",
      features: [
        "Campanhas segmentadas por perfil",
        "Automação de nurture de leads",
        "Promoções e ofertas personalizadas",
        "Análise de engajamento em tempo real"
      ]
    },
    {
      icon: Headphones,
      title: "Suporte ao Cliente",
      description: "Atendimento humanizado que resolve dúvidas, soluciona problemas e mantém clientes satisfeitos.",
      features: [
        "Resolução automática de dúvidas comuns",
        "Escalação inteligente para humanos",
        "Base de conhecimento integrada",
        "Métricas de satisfação do cliente"
      ]
    }
  ];

  const industries = [
    {
      title: "E-commerce",
      description: "Automatize vendas, suporte pós-venda e retenção de clientes.",
      useCases: ["Vendas consultivas", "Suporte de produtos", "Abandono de carrinho"]
    },
    {
      title: "Serviços Profissionais",
      description: "Qualifique leads, agende consultas e mantenha clientes engajados.",
      useCases: ["Qualificação de leads", "Agendamento de consultas", "Follow-up de clientes"]
    },
    {
      title: "Educação",
      description: "Atenda dúvidas de alunos, forneça informações e automatize matrículas.",
      useCases: ["Suporte ao aluno", "Informações sobre cursos", "Processo de matrícula"]
    },
    {
      title: "Saúde",
      description: "Agende consultas, envie lembretes e forneça informações básicas.",
      useCases: ["Agendamento de consultas", "Lembretes de exames", "Informações gerais"]
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Soluções para seu Negócio
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Automatize vendas, marketing e suporte com agentes de IA especializados via WhatsApp
          </p>
        </div>

        {/* Principais Soluções */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Nossas Principais Soluções</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {solutions.map((solution, index) => (
              <div key={index} className="bg-card border rounded-lg p-8 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                    <solution.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold">{solution.title}</h3>
                </div>
                <p className="text-muted-foreground mb-6">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2"></div>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Por Setor */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Soluções por Setor</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {industries.map((industry, index) => (
              <div key={index} className="bg-muted/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3">{industry.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{industry.description}</p>
                <div className="space-y-2">
                  {industry.useCases.map((useCase, useCaseIndex) => (
                    <div key={useCaseIndex} className="text-xs bg-background rounded px-2 py-1">
                      {useCase}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Benefícios */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o Falachefe?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Implementação Rápida</h3>
              <p className="text-muted-foreground text-sm">
                Configure seus agentes em minutos, não em semanas
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Segurança Total</h3>
              <p className="text-muted-foreground text-sm">
                Conformidade com LGPD e criptografia ponta a ponta
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analytics Avançado</h3>
              <p className="text-muted-foreground text-sm">
                Métricas detalhadas de performance e conversão
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">IA Especializada</h3>
              <p className="text-muted-foreground text-sm">
                Agentes treinados para seu setor e necessidades
              </p>
            </div>
          </div>
        </section>

        {/* Casos de Sucesso */}
        <section className="mb-20">
          <h2 className="text-3xl font-bold text-center mb-12">Resultados Comprovados</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center bg-muted/50 rounded-lg p-8">
              <div className="text-4xl font-bold text-primary mb-2">85%</div>
              <div className="text-lg font-semibold mb-2">Redução no Tempo de Resposta</div>
              <p className="text-muted-foreground text-sm">
                Clientes recebem respostas instantâneas 24/7
              </p>
            </div>
            <div className="text-center bg-muted/50 rounded-lg p-8">
              <div className="text-4xl font-bold text-primary mb-2">3x</div>
              <div className="text-lg font-semibold mb-2">Aumento nas Conversões</div>
              <p className="text-muted-foreground text-sm">
                Agentes especializados convertem mais leads
              </p>
            </div>
            <div className="text-center bg-muted/50 rounded-lg p-8">
              <div className="text-4xl font-bold text-primary mb-2">60%</div>
              <div className="text-lg font-semibold mb-2">Redução nos Custos</div>
              <p className="text-muted-foreground text-sm">
                Menos necessidade de equipe de atendimento
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Pronto para automatizar seu negócio?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Descubra como o Falachefe pode transformar seu atendimento
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/planos" 
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Ver Planos
            </a>
            <a 
              href="/contato" 
              className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Agendar Demo
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
