import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sobre o Falachefe - Plataforma de Chat Multagente",
  description: "Conheça a história e a missão do Falachefe, a plataforma SaaS que revoluciona o atendimento via WhatsApp com agentes de IA especializados.",
};

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Sobre o Falachefe
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Revolucionando o atendimento via WhatsApp com agentes de IA especializados
            </p>
          </div>

          {/* Missão */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Nossa Missão</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <p className="text-lg text-muted-foreground mb-6">
                  Democratizar o acesso à inteligência artificial para empresas de todos os tamanhos, 
                  oferecendo soluções de automação de atendimento via WhatsApp que são poderosas, 
                  acessíveis e fáceis de usar.
                </p>
                <p className="text-muted-foreground">
                  Acreditamos que toda empresa merece ter acesso às melhores tecnologias de IA 
                  para proporcionar experiências excepcionais aos seus clientes.
                </p>
              </div>
              <div className="bg-muted/50 rounded-lg p-8">
                <h3 className="text-xl font-semibold mb-4">Nossos Valores</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <span>Inovação contínua</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <span>Simplicidade e usabilidade</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <span>Transparência e confiança</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <span>Suporte excepcional ao cliente</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* História */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Nossa História</h2>
            <div className="space-y-6 text-muted-foreground">
              <p className="text-lg">
                O Falachefe nasceu da necessidade de simplificar e democratizar o uso de agentes de IA 
                para atendimento via WhatsApp. Observamos que muitas empresas, especialmente PMEs, 
                tinham dificuldade para implementar soluções complexas de automação.
              </p>
              <p>
                Nossa equipe de especialistas em IA, desenvolvimento de software e experiência do usuário 
                se uniu para criar uma plataforma que combina o poder da inteligência artificial com 
                a simplicidade que as empresas precisam.
              </p>
              <p>
                Hoje, o Falachefe é usado por empresas de diversos setores, desde e-commerce até serviços 
                profissionais, ajudando-as a automatizar vendas, marketing e suporte com agentes especializados 
                que conversam de forma natural e eficiente.
              </p>
            </div>
          </section>

          {/* Equipe */}
          <section className="mb-16">
            <h2 className="text-3xl font-bold mb-8">Nossa Equipe</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">IA</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Especialistas em IA</h3>
                <p className="text-muted-foreground">
                  Desenvolvemos agentes inteligentes que entendem contexto e respondem de forma natural
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">UX</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Designers de UX</h3>
                <p className="text-muted-foreground">
                  Criamos interfaces intuitivas que tornam a automação acessível para todos
                </p>
              </div>
              <div className="text-center">
                <div className="w-24 h-24 bg-primary/10 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-2xl font-bold text-primary">DEV</span>
                </div>
                <h3 className="text-xl font-semibold mb-2">Desenvolvedores</h3>
                <p className="text-muted-foreground">
                  Construímos uma plataforma robusta e escalável para milhares de usuários
                </p>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="text-center bg-muted/50 rounded-lg p-12">
            <h2 className="text-3xl font-bold mb-4">Pronto para fazer parte da nossa história?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Junte-se a centenas de empresas que já automatizaram seu atendimento com o Falachefe
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a 
                href="/planos" 
                className="inline-flex items-center justify-center px-8 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Começar Agora
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
    </div>
  );
}
