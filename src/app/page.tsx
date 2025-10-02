"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuthButton } from "@/components/auth/auth-button";
import { MessageSquare, Bot, Users, BarChart3, Shield, Zap, Smartphone } from "lucide-react";

export default function Home() {
  return (
    <main className="flex-1">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/5 py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10">
                <MessageSquare className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-6xl font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                Falachefe
              </h1>
            </div>
            
            <h2 className="text-3xl font-semibold text-muted-foreground">
              Plataforma SaaS de Chat Multagente via WhatsApp
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Automatize vendas, marketing e suporte com agentes de IA especializados que conversam exclusivamente via WhatsApp. 
              Sistema de memória persistente e orquestração inteligente.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <AuthButton size="lg" className="text-lg px-8 py-6">
                Acessar Painel Admin
              </AuthButton>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/demo">
                  Ver Demonstração
                  <Smartphone className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h3 className="text-3xl font-bold mb-4">Por que escolher o Falachefe?</h3>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A plataforma mais avançada para automação de atendimento via WhatsApp com agentes de IA especializados
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Agentes Especializados</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Agentes de IA especializados em vendas, suporte, marketing e financeiro, 
                  cada um com memória individual e conhecimento compartilhado.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Vendas</Badge>
                  <Badge variant="secondary">Suporte</Badge>
                  <Badge variant="secondary">Marketing</Badge>
                  <Badge variant="secondary">Financeiro</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>WhatsApp Business</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Integração nativa com WhatsApp Business via UAZ API. 
                  Suporte completo a templates, mensagens interativas e conformidade com políticas do WhatsApp.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Templates</Badge>
                  <Badge variant="secondary">Interativo</Badge>
                  <Badge variant="secondary">24h Window</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <BarChart3 className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Analytics Avançado</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Dashboards em tempo real com métricas de performance, 
                  satisfação do usuário e eficiência dos agentes.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Tempo Real</Badge>
                  <Badge variant="secondary">Métricas</Badge>
                  <Badge variant="secondary">Relatórios</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Gestão Completa</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Painel administrativo completo para gestão de agentes, 
                  templates, assinantes e configurações avançadas.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">RBAC</Badge>
                  <Badge variant="secondary">Auditoria</Badge>
                  <Badge variant="secondary">Sandbox</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Segurança & Compliance</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Conformidade total com LGPD/GDPR, criptografia ponta a ponta 
                  e auditoria completa de todas as ações.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">LGPD</Badge>
                  <Badge variant="secondary">GDPR</Badge>
                  <Badge variant="secondary">Criptografia</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/20 transition-colors">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Escalabilidade</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Arquitetura serverless com auto-scaling, 
                  suporte a milhares de conversas simultâneas e 99.9% de uptime.
                </CardDescription>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Badge variant="secondary">Serverless</Badge>
                  <Badge variant="secondary">Auto-scaling</Badge>
                  <Badge variant="secondary">99.9% Uptime</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-muted/50 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">24/7</div>
              <div className="text-muted-foreground">Disponibilidade</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">&lt;3s</div>
              <div className="text-muted-foreground">Tempo de Resposta</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl font-bold text-primary">1000+</div>
              <div className="text-muted-foreground">Conversas Simultâneas</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto space-y-8">
            <h3 className="text-3xl font-bold">Pronto para revolucionar seu atendimento?</h3>
            <p className="text-xl text-muted-foreground">
              Comece agora e automatize seu negócio com agentes de IA especializados via WhatsApp.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <AuthButton size="lg" className="text-lg px-8 py-6">
                Começar Agora
              </AuthButton>
              <Button asChild variant="outline" size="lg" className="text-lg px-8 py-6">
                <Link href="/contato">
                  Falar com Especialista
                  <MessageSquare className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}