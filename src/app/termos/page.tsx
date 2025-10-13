import { FileText, CheckCircle, AlertCircle, Scale } from "lucide-react"

export default function TermosPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10">
              <FileText className="h-10 w-10 text-primary" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Termos de Uso
          </h1>
          
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Aceitação dos Termos
            </h2>
            <p className="text-muted-foreground">
              Ao acessar e usar a plataforma Falachefe, você concorda com estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não utilize nossos serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Definições</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li><strong>Plataforma:</strong> O sistema Falachefe, incluindo todos os seus componentes, APIs e integrações</li>
              <li><strong>Usuário:</strong> Pessoa física ou jurídica que utiliza a plataforma</li>
              <li><strong>Agentes:</strong> Assistentes virtuais de IA disponibilizados pela plataforma</li>
              <li><strong>Conteúdo:</strong> Textos, imagens, dados e informações inseridas na plataforma</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Uso da Plataforma</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">Licença de Uso</h3>
                <p className="text-muted-foreground">
                  Concedemos uma licença limitada, não exclusiva, intransferível e revogável para usar a plataforma de acordo com estes termos.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Responsabilidades do Usuário</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Manter a confidencialidade de suas credenciais de acesso</li>
                  <li>Usar a plataforma de forma legal e ética</li>
                  <li>Não compartilhar ou revender o acesso à plataforma</li>
                  <li>Respeitar os direitos de propriedade intelectual</li>
                  <li>Não tentar burlar medidas de segurança</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Usos Proibidos</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Spam ou comunicações não solicitadas</li>
                  <li>Conteúdo ilegal, ofensivo ou prejudicial</li>
                  <li>Tentativas de engenharia reversa</li>
                  <li>Uso de bots ou automação não autorizada</li>
                  <li>Violação de privacidade de terceiros</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Scale className="h-6 w-6 text-primary" />
              Propriedade Intelectual
            </h2>
            <p className="text-muted-foreground mb-4">
              Todos os direitos sobre a plataforma, incluindo código, design, marca e conteúdo, pertencem à Falachefe ou seus licenciadores.
            </p>
            <p className="text-muted-foreground">
              O conteúdo criado por você na plataforma permanece sua propriedade, mas você nos concede licença para processá-lo e armazená-lo conforme necessário para fornecer os serviços.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Planos e Pagamentos</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold mb-2">Assinaturas</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Planos são cobrados mensalmente ou anualmente</li>
                  <li>Renovação automática, salvo cancelamento</li>
                  <li>Preços podem ser alterados com aviso prévio de 30 dias</li>
                  <li>Não há reembolso proporcional em cancelamentos</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Período de Teste</h3>
                <p>
                  Oferecemos período de teste gratuito conforme especificado no momento da contratação. Após o período, a cobrança inicia automaticamente.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-primary" />
              Limitação de Responsabilidade
            </h2>
            <p className="text-muted-foreground mb-4">
              A plataforma é fornecida &quot;como está&quot;. Não garantimos:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Disponibilidade ininterrupta do serviço</li>
              <li>Ausência total de erros ou bugs</li>
              <li>Adequação a todos os propósitos específicos</li>
              <li>Compatibilidade com todas as integrações</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Nossa responsabilidade máxima limita-se ao valor pago nos últimos 12 meses.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Privacidade e Dados</h2>
            <p className="text-muted-foreground">
              O tratamento de dados pessoais está regulamentado em nossa <a href="/privacidade" className="text-primary hover:underline">Política de Privacidade</a>, que faz parte integrante destes termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Modificações dos Termos</h2>
            <p className="text-muted-foreground">
              Reservamos o direito de modificar estes termos a qualquer momento. Mudanças significativas serão notificadas com 15 dias de antecedência. O uso continuado após as mudanças constitui aceitação dos novos termos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Cancelamento e Suspensão</h2>
            <div className="space-y-4 text-muted-foreground">
              <div>
                <h3 className="text-lg font-semibold mb-2">Pelo Usuário</h3>
                <p>Você pode cancelar a qualquer momento através das configurações da conta ou entrando em contato conosco.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Pela Falachefe</h3>
                <p>Podemos suspender ou encerrar sua conta em caso de:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Violação destes termos</li>
                  <li>Atividade fraudulenta ou ilegal</li>
                  <li>Inadimplência de pagamento</li>
                  <li>Uso abusivo da plataforma</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Lei Aplicável e Jurisdição</h2>
            <p className="text-muted-foreground">
              Estes termos são regidos pelas leis brasileiras. Quaisquer disputas serão resolvidas no foro da comarca de São Paulo - SP.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contato</h2>
            <p className="text-muted-foreground mb-4">
              Para dúvidas sobre estes termos, entre em contato:
            </p>
            <ul className="list-none text-muted-foreground space-y-1">
              <li><strong>E-mail:</strong> legal@falachefe.com</li>
              <li><strong>Suporte:</strong> suporte@falachefe.com</li>
              <li><strong>Telefone:</strong> +55 (11) 99999-9999</li>
            </ul>
          </section>

        </div>
      </div>
    </div>
  )
}

