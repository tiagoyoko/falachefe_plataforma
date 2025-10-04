import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Calendar, 
  Download, 
  AlertCircle,
  CheckCircle,
  TrendingUp
} from "lucide-react";

export const metadata: Metadata = {
  title: "Cobrança - Falachefe",
  description: "Gerencie sua assinatura, faturas e métodos de pagamento.",
};

export default function BillingPage() {
  const currentPlan = {
    name: "Professional",
    price: "R$ 197",
    period: "mensal",
    status: "ativo",
    nextBilling: "15 de Fevereiro, 2025",
    features: [
      "Até 5.000 conversas/mês",
      "3 agentes de IA especializados",
      "Dashboard avançado com analytics",
      "Suporte prioritário",
      "Integração com CRM"
    ]
  };

  const invoices = [
    {
      id: "INV-001",
      date: "15 de Janeiro, 2025",
      amount: "R$ 197,00",
      status: "pago",
      downloadUrl: "#"
    },
    {
      id: "INV-002", 
      date: "15 de Dezembro, 2024",
      amount: "R$ 197,00",
      status: "pago",
      downloadUrl: "#"
    },
    {
      id: "INV-003",
      date: "15 de Novembro, 2024", 
      amount: "R$ 197,00",
      status: "pago",
      downloadUrl: "#"
    }
  ];

  const usage = {
    conversations: {
      used: 3247,
      limit: 5000,
      percentage: 65
    },
    agents: {
      used: 2,
      limit: 3,
      percentage: 67
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Cobrança</h1>
            <p className="text-muted-foreground">
              Gerencie sua assinatura, faturas e métodos de pagamento
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Plano Atual */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Plano Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                      <p className="text-muted-foreground">
                        {currentPlan.price}/{currentPlan.period}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {currentPlan.status}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-medium mb-3">Recursos Inclusos</h4>
                    <ul className="space-y-2">
                      {currentPlan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <Separator />

                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Próxima cobrança</p>
                      <p className="font-medium">{currentPlan.nextBilling}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <Button variant="outline" className="w-full sm:w-auto">Alterar Plano</Button>
                      <Button variant="outline" className="w-full sm:w-auto">Cancelar Assinatura</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Uso Atual */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Uso Atual
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Conversas este mês</span>
                      <span className="text-sm text-muted-foreground">
                        {usage.conversations.used.toLocaleString()} / {usage.conversations.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${usage.conversations.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {usage.conversations.percentage}% utilizado
                    </p>
                  </div>

                  <Separator />

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium">Agentes Ativos</span>
                      <span className="text-sm text-muted-foreground">
                        {usage.agents.used} / {usage.agents.limit}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${usage.agents.percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {usage.agents.percentage}% utilizado
                    </p>
                  </div>

                  {usage.conversations.percentage > 80 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <p className="text-sm text-yellow-800">
                        Você está próximo do limite de conversas. Considere fazer upgrade.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Histórico de Faturas */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Faturas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {invoices.map((invoice) => (
                      <div key={invoice.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div>
                            <p className="font-medium">#{invoice.id}</p>
                            <p className="text-sm text-muted-foreground">{invoice.date}</p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 w-fit">
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 w-full sm:w-auto">
                          <span className="font-medium">{invoice.amount}</span>
                          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                            <Download className="h-4 w-4 mr-2" />
                            Baixar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Método de Pagamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Método de Pagamento</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                      <p className="text-xs text-muted-foreground">Expira em 12/26</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Alterar Cartão
                  </Button>
                </CardContent>
              </Card>

              {/* Próximas Cobranças */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Próximas Cobranças
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">15 de Fevereiro</span>
                    <span className="text-sm font-medium">R$ 197,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">15 de Março</span>
                    <span className="text-sm font-medium">R$ 197,00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">15 de Abril</span>
                    <span className="text-sm font-medium">R$ 197,00</span>
                  </div>
                </CardContent>
              </Card>

              {/* Economia Anual */}
              <Card>
                <CardHeader>
                  <CardTitle>Economize com Plano Anual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-3">
                    <div className="text-2xl font-bold text-green-600">17% de desconto</div>
                    <p className="text-sm text-muted-foreground">
                      Economize R$ 394 por ano
                    </p>
                    <Button className="w-full">
                      Fazer Upgrade para Anual
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Suporte */}
              <Card>
                <CardHeader>
                  <CardTitle>Precisa de Ajuda?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full">
                    Falar com Suporte
                  </Button>
                  <Button variant="outline" className="w-full">
                    Ver FAQ de Cobrança
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
