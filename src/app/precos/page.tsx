import { Metadata } from "next";
import { Check, Star, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Preços - Planos e Valores do Falachefe",
  description: "Escolha o plano ideal para seu negócio. Preços transparentes e sem surpresas para automatizar seu atendimento via WhatsApp.",
};

export default function PrecosPage() {
  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfeito para pequenas empresas que estão começando',
      price: {
        monthly: 97,
        yearly: 970
      },
      features: [
        'Até 1.000 conversas/mês',
        '1 agente de IA especializado',
        'Integração com WhatsApp Business',
        'Dashboard básico',
        'Suporte por email',
        'Templates básicos'
      ],
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'Ideal para empresas em crescimento',
      price: {
        monthly: 197,
        yearly: 1970
      },
      features: [
        'Até 5.000 conversas/mês',
        '3 agentes de IA especializados',
        'Integração com WhatsApp Business',
        'Dashboard avançado com analytics',
        'Suporte prioritário',
        'Templates personalizados',
        'Automação de campanhas',
        'Integração com CRM'
      ],
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Para grandes empresas com necessidades específicas',
      price: {
        monthly: 'Sob consulta',
        yearly: 'Sob consulta'
      },
      features: [
        'Conversas ilimitadas',
        'Agentes de IA ilimitados',
        'Integração com WhatsApp Business',
        'Dashboard personalizado',
        'Suporte dedicado 24/7',
        'Templates personalizados',
        'Automação avançada',
        'Integração com múltiplos CRMs',
        'API personalizada',
        'Treinamento dedicado',
        'SLA garantido'
      ],
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Preços Transparentes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Escolha o plano ideal para seu negócio. Sem taxas ocultas, sem surpresas.
          </p>
          
          {/* Toggle Mensal/Anual */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className="text-sm font-medium">Mensal</span>
            <div className="relative">
              <input type="checkbox" id="billing-toggle" className="sr-only" />
              <label htmlFor="billing-toggle" className="flex items-center cursor-pointer">
                <div className="relative">
                  <div className="w-14 h-7 bg-muted rounded-full shadow-inner"></div>
                  <div className="absolute top-0.5 left-0.5 w-6 h-6 bg-primary rounded-full shadow transition-transform duration-200 ease-in-out"></div>
                </div>
              </label>
            </div>
            <span className="text-sm font-medium">Anual</span>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
              Economize 17%
            </div>
          </div>
        </div>

        {/* Planos */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <div 
              key={plan.id} 
              className={`relative bg-card border rounded-lg p-8 ${
                plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Mais Popular
                  </div>
                </div>
              )}
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground mb-4">{plan.description}</p>
                <div className="mb-4">
                  {typeof plan.price.monthly === 'number' ? (
                    <>
                      <span className="text-4xl font-bold">R$ {plan.price.monthly}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </>
                  ) : (
                    <span className="text-2xl font-bold">{plan.price.monthly}</span>
                  )}
                </div>
                {typeof plan.price.yearly === 'number' && (
                  <div className="text-sm text-muted-foreground">
                    ou R$ {plan.price.yearly}/ano (economia de 17%)
                  </div>
                )}
              </div>

              <ul className="space-y-4 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                className={`w-full py-3 rounded-md font-medium transition-colors ${
                  plan.popular
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {plan.id === 'enterprise' ? 'Falar com Vendas' : 'Começar Agora'}
              </button>
            </div>
          ))}
        </div>

        {/* Comparação de Recursos */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Comparação de Recursos</h2>
          <div className="bg-card border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold">Recursos</th>
                  <th className="text-center p-4 font-semibold">Starter</th>
                  <th className="text-center p-4 font-semibold">Professional</th>
                  <th className="text-center p-4 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-4">Conversas por mês</td>
                  <td className="text-center p-4">1.000</td>
                  <td className="text-center p-4">5.000</td>
                  <td className="text-center p-4">Ilimitadas</td>
                </tr>
                <tr className="border-t bg-muted/25">
                  <td className="p-4">Agentes de IA</td>
                  <td className="text-center p-4">1</td>
                  <td className="text-center p-4">3</td>
                  <td className="text-center p-4">Ilimitados</td>
                </tr>
                <tr className="border-t">
                  <td className="p-4">Dashboard</td>
                  <td className="text-center p-4">Básico</td>
                  <td className="text-center p-4">Avançado</td>
                  <td className="text-center p-4">Personalizado</td>
                </tr>
                <tr className="border-t bg-muted/25">
                  <td className="p-4">Suporte</td>
                  <td className="text-center p-4">Email</td>
                  <td className="text-center p-4">Prioritário</td>
                  <td className="text-center p-4">24/7 Dedicado</td>
                </tr>
                <tr className="border-t">
                  <td className="p-4">Integração CRM</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">✓</td>
                  <td className="text-center p-4">Múltiplos</td>
                </tr>
                <tr className="border-t bg-muted/25">
                  <td className="p-4">API Personalizada</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">-</td>
                  <td className="text-center p-4">✓</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-muted-foreground">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                As alterações são aplicadas imediatamente e os valores são ajustados proporcionalmente.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Há período de teste gratuito?</h3>
              <p className="text-muted-foreground">
                Oferecemos 14 dias de teste gratuito para todos os planos. Não é necessário cartão de crédito para começar.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Como funciona o suporte?</h3>
              <p className="text-muted-foreground">
                O suporte varia por plano: Starter (email), Professional (prioritário) e Enterprise (dedicado 24/7). 
                Todos os planos incluem documentação completa e tutoriais.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-muted-foreground">
                Sim, você pode cancelar sua assinatura a qualquer momento. Não há taxas de cancelamento ou multas.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="text-center bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-12">
          <h2 className="text-3xl font-bold mb-4">Pronto para começar?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Escolha seu plano e automatize seu atendimento em minutos
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/planos" 
              className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Ver Planos Detalhados
            </a>
            <a 
              href="/contato" 
              className="inline-flex items-center justify-center px-8 py-3 border border-border rounded-md hover:bg-accent transition-colors"
            >
              Falar com Vendas
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
