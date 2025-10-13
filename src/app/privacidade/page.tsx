import { Shield, Lock, Eye, Server } from "lucide-react"

export default function PrivacidadePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <Shield className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Política de Privacidade
          </h1>
          
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lock className="h-6 w-6 text-primary" />
              Compromisso com sua Privacidade
            </h2>
            <p className="text-muted-foreground">
              A Falachefe está comprometida em proteger e respeitar sua privacidade. Esta política explica como coletamos, usamos e protegemos suas informações pessoais.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Informações que Coletamos</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Dados de Cadastro</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Nome e sobrenome</li>
                  <li>E-mail</li>
                  <li>Telefone / WhatsApp</li>
                  <li>Informações da empresa</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Dados de Uso</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Conversas e interações com os agentes</li>
                  <li>Métricas de uso da plataforma</li>
                  <li>Preferências e configurações</li>
                  <li>Logs de acesso e atividade</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Dados Técnicos</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Endereço IP</li>
                  <li>Tipo de navegador</li>
                  <li>Sistema operacional</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Eye className="h-6 w-6 text-primary" />
              Como Usamos suas Informações
            </h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Fornecer e melhorar nossos serviços</li>
              <li>Personalizar sua experiência</li>
              <li>Processar pagamentos e transações</li>
              <li>Enviar atualizações e comunicações importantes</li>
              <li>Garantir a segurança da plataforma</li>
              <li>Cumprir obrigações legais</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Server className="h-6 w-6 text-primary" />
              Proteção de Dados
            </h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>Criptografia SSL/TLS para todas as comunicações</li>
                <li>Armazenamento seguro em servidores certificados</li>
                <li>Controle de acesso rigoroso</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backup regular de dados</li>
              </ul>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Compartilhamento de Dados</h2>
            <p className="text-muted-foreground mb-4">
              Não vendemos suas informações pessoais. Podemos compartilhar dados apenas nos seguintes casos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Com provedores de serviço confiáveis (hospedagem, processamento de pagamentos)</li>
              <li>Quando exigido por lei ou ordem judicial</li>
              <li>Para proteger nossos direitos legais</li>
              <li>Com seu consentimento explícito</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Seus Direitos (LGPD)</h2>
            <p className="text-muted-foreground mb-4">
              De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem direito a:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Confirmar a existência de tratamento de dados</li>
              <li>Acessar seus dados pessoais</li>
              <li>Corrigir dados incompletos ou desatualizados</li>
              <li>Solicitar a anonimização ou exclusão de dados</li>
              <li>Revogar o consentimento</li>
              <li>Portabilidade de dados</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Cookies</h2>
            <p className="text-muted-foreground">
              Utilizamos cookies para melhorar sua experiência. Você pode gerenciar preferências de cookies nas configurações do navegador. Cookies essenciais são necessários para o funcionamento da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Alterações nesta Política</h2>
            <p className="text-muted-foreground">
              Podemos atualizar esta política periodicamente. Notificaremos sobre mudanças significativas por e-mail ou através da plataforma.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contato</h2>
            <p className="text-muted-foreground">
              Para dúvidas sobre privacidade ou exercer seus direitos, entre em contato:
            </p>
            <ul className="list-none text-muted-foreground space-y-1 mt-4">
              <li><strong>E-mail:</strong> privacidade@falachefe.com</li>
              <li><strong>DPO:</strong> dpo@falachefe.com</li>
              <li><strong>Telefone:</strong> +55 (11) 99999-9999</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}

