"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, MessageSquare, Bot, BarChart3, Users, Shield, Zap } from "lucide-react";

const plans = [
  {
    id: "starter",
    name: "Starter",
    description: "Perfeito para pequenas empresas que estão começando",
    priceMonthly: 99.90,
    priceYearly: 999.00,
    popular: false,
    features: [
      "Até 100 usuários únicos",
      "2 agentes de IA especializados",
      "1.000 mensagens/mês",
      "Suporte por email",
      "Templates básicos do WhatsApp",
      "Relatórios simples",
      "Integração básica",
      "Backup automático"
    ],
    limitations: [
      "Sem suporte prioritário",
      "Sem personalização avançada"
    ]
  },
  {
    id: "professional",
    name: "Professional",
    description: "Ideal para empresas em crescimento",
    priceMonthly: 199.90,
    priceYearly: 1999.00,
    popular: true,
    features: [
      "Até 1.000 usuários únicos",
      "5 agentes de IA especializados",
      "10.000 mensagens/mês",
      "Suporte prioritário",
      "Templates avançados do WhatsApp",
      "Relatórios detalhados",
      "Todas as integrações",
      "Backup automático",
      "Analytics em tempo real",
      "Personalização de agentes"
    ],
    limitations: [
      "Sem gerente de conta dedicado"
    ]
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "Solução completa para grandes empresas",
    priceMonthly: 499.90,
    priceYearly: 4999.00,
    popular: false,
    features: [
      "Usuários ilimitados",
      "Agentes ilimitados",
      "Mensagens ilimitadas",
      "Suporte 24/7",
      "Todas as funcionalidades do WhatsApp Business",
      "Relatórios personalizados",
      "Todas as integrações",
      "Backup automático + manual",
      "Analytics avançado",
      "Personalização completa",
      "Gerente de conta dedicado",
      "SLA garantido",
      "Treinamento personalizado",
      "API personalizada"
    ],
    limitations: []
  }
];

export default function PlanosPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (billingCycle === 'yearly') {
      const monthlyTotal = plan.priceMonthly * 12;
      const yearlyPrice = plan.priceYearly;
      const savings = monthlyTotal - yearlyPrice;
      return savings;
    }
    return 0;
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <section className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
                <MessageSquare className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                Falachefe
              </h1>
            </div>
            <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal para sua empresa</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automatize seu atendimento com agentes de IA especializados via WhatsApp. 
              Comece grátis e escale conforme sua necessidade.
            </p>
          </div>
        </div>
      </section>

      {/* Billing Toggle */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-center bg-white rounded-lg p-1 border">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'monthly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingCycle === 'yearly'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Anual
                <Badge variant="secondary" className="ml-2 text-xs">
                  -17%
                </Badge>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border-2 transition-all duration-200 hover:shadow-lg ${
                  plan.popular 
                    ? 'border-primary shadow-lg scale-105' 
                    : 'border-border hover:border-primary/20'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1">
                      <Star className="w-3 h-3 mr-1" />
                      Mais Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <div className="text-4xl font-bold">
                      R$ {getPrice(plan).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      por {billingCycle === 'yearly' ? 'ano' : 'mês'}
                    </div>
                    {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                      <div className="text-sm text-green-600 font-medium">
                        Economize R$ {getSavings(plan).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    size="lg"
                  >
                    {plan.id === 'enterprise' ? 'Falar com Vendas' : 'Começar Agora'}
                  </Button>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      O que está incluído:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Limitações:
                      </h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Comparação de Recursos</h3>
              <p className="text-xl text-muted-foreground">
                Veja todos os recursos disponíveis em cada plano
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-lg">Recursos</h4>
                <div className="space-y-3 text-sm">
                  <div>Usuários únicos</div>
                  <div>Agentes de IA</div>
                  <div>Mensagens/mês</div>
                  <div>Suporte</div>
                  <div>Templates WhatsApp</div>
                  <div>Relatórios</div>
                  <div>Integrações</div>
                  <div>Backup</div>
                  <div>Analytics</div>
                  <div>Personalização</div>
                  <div>Gerente de conta</div>
                  <div>SLA</div>
                </div>
              </div>

              {plans.map((plan) => (
                <div key={plan.id} className="space-y-4">
                  <h4 className={`font-semibold text-lg ${plan.popular ? 'text-primary' : ''}`}>
                    {plan.name}
                  </h4>
                  <div className="space-y-3 text-sm">
                    <div>{plan.id === 'starter' ? '100' : plan.id === 'professional' ? '1.000' : 'Ilimitados'}</div>
                    <div>{plan.id === 'starter' ? '2' : plan.id === 'professional' ? '5' : 'Ilimitados'}</div>
                    <div>{plan.id === 'starter' ? '1.000' : plan.id === 'professional' ? '10.000' : 'Ilimitadas'}</div>
                    <div>{plan.id === 'starter' ? 'Email' : plan.id === 'professional' ? 'Prioritário' : '24/7'}</div>
                    <div>{plan.id === 'starter' ? 'Básicos' : plan.id === 'professional' ? 'Avançados' : 'Todos'}</div>
                    <div>{plan.id === 'starter' ? 'Simples' : plan.id === 'professional' ? 'Detalhados' : 'Personalizados'}</div>
                    <div>{plan.id === 'starter' ? 'Básicas' : 'Todas'}</div>
                    <div>Automático</div>
                    <div>{plan.id === 'starter' ? 'Não' : 'Sim'}</div>
                    <div>{plan.id === 'starter' ? 'Não' : plan.id === 'professional' ? 'Parcial' : 'Completa'}</div>
                    <div>{plan.id === 'enterprise' ? 'Sim' : 'Não'}</div>
                    <div>{plan.id === 'enterprise' ? '99.9%' : 'Não'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h3 className="text-3xl font-bold mb-4">Perguntas Frequentes</h3>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posso mudar de plano a qualquer momento?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                    As alterações são aplicadas imediatamente e o valor é calculado proporcionalmente.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Existe período de teste gratuito?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Oferecemos 14 dias de teste gratuito para todos os planos. 
                    Não é necessário cartão de crédito para começar.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Como funciona o suporte?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    O plano Starter inclui suporte por email. O Professional tem suporte prioritário, 
                    e o Enterprise inclui suporte 24/7 com gerente de conta dedicado.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Posso cancelar a qualquer momento?</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Sim, você pode cancelar sua assinatura a qualquer momento. 
                    Não há taxas de cancelamento ou compromissos de longo prazo.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h3 className="text-3xl font-bold">Pronto para começar?</h3>
            <p className="text-xl text-muted-foreground">
              Comece seu teste gratuito hoje mesmo e veja como o Falachefe pode revolucionar seu atendimento.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-6">
                Começar Teste Gratuito
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
                <Link href="/login">
                  Já tenho uma conta
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
