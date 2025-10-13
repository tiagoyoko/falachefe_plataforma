import { Metadata } from "next";
import { Mail, MapPin, Clock, MessageSquare, Users, Zap } from "lucide-react";

export const metadata: Metadata = {
  title: "Contato - Fale com a Equipe Falachefe",
  description: "Entre em contato com nossa equipe. Suporte técnico, vendas, parcerias e dúvidas gerais sobre o Falachefe.",
};

export default function ContatoPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Fale Conosco
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Estamos aqui para ajudar. Entre em contato conosco para dúvidas, suporte ou informações sobre nossos planos.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Informações de Contato */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Informações de Contato</h2>
            
            <div className="space-y-6 mb-12">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Email</h3>
                  <p className="text-muted-foreground mb-2">contato@falachefe.com.br</p>
                  <p className="text-sm text-muted-foreground">
                    Resposta em até 24 horas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageSquare className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">WhatsApp</h3>
                  <p className="text-muted-foreground mb-2">+55 (11) 99999-9999</p>
                  <p className="text-sm text-muted-foreground">
                    Segunda a sexta, 9h às 18h
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Endereço</h3>
                  <p className="text-muted-foreground">
                    São Paulo, SP - Brasil<br />
                    Atendimento 100% online
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Horário de Atendimento</h3>
                  <p className="text-muted-foreground">
                    Segunda a sexta: 9h às 18h (Brasília)<br />
                    Sábado: 9h às 14h<br />
                    Domingo: Fechado
                  </p>
                </div>
              </div>
            </div>

            {/* Tipos de Contato */}
            <div>
              <h3 className="text-xl font-semibold mb-6">Como podemos ajudar?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Zap className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Suporte Técnico</h4>
                    <p className="text-sm text-muted-foreground">
                      Problemas com a plataforma, configuração ou integração
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Vendas</h4>
                    <p className="text-sm text-muted-foreground">
                      Informações sobre planos, demos e personalização
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium">Parcerias</h4>
                    <p className="text-sm text-muted-foreground">
                      Oportunidades de parceria e integração
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Formulário de Contato */}
          <div>
            <h2 className="text-2xl font-bold mb-8">Envie sua Mensagem</h2>
            
            <form className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Seu nome completo"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Empresa
                </label>
                <input
                  type="text"
                  id="company"
                  name="company"
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Nome da sua empresa"
                />
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-2">
                  Assunto *
                </label>
                <select
                  id="subject"
                  name="subject"
                  required
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">Selecione o assunto</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="vendas">Informações de Vendas</option>
                  <option value="parceria">Parceria</option>
                  <option value="demo">Solicitar Demo</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Mensagem *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  placeholder="Descreva sua dúvida ou solicitação..."
                />
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="privacy"
                  name="privacy"
                  required
                  className="mt-1"
                />
                <label htmlFor="privacy" className="text-sm text-muted-foreground">
                  Concordo com o processamento dos meus dados pessoais conforme a 
                  <a href="/privacidade" className="text-primary hover:underline"> Política de Privacidade</a>
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground py-3 px-6 rounded-md hover:bg-primary/90 transition-colors font-medium"
              >
                Enviar Mensagem
              </button>
            </form>

            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <h3 className="font-semibold mb-2">Resposta Rápida Garantida</h3>
              <p className="text-sm text-muted-foreground">
                Nossa equipe responde todas as mensagens em até 24 horas. 
                Para suporte urgente, utilize o WhatsApp.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Rápido */}
        <section className="mt-20">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Como funciona o período de teste?</h3>
              <p className="text-sm text-muted-foreground">
                Oferecemos 14 dias de teste gratuito. Não é necessário cartão de crédito.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Posso integrar com meu CRM existente?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Temos integrações com os principais CRMs do mercado.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Quanto tempo leva para implementar?</h3>
              <p className="text-sm text-muted-foreground">
                A implementação básica leva menos de 1 hora. Configurações avançadas podem levar alguns dias.
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-6">
              <h3 className="font-semibold mb-2">Oferecem treinamento?</h3>
              <p className="text-sm text-muted-foreground">
                Sim! Incluímos treinamento básico em todos os planos e dedicado no Enterprise.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
