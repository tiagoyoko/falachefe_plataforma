import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Settings, 
  Bell, 
  Shield, 
  Globe, 
  Palette, 
  Smartphone,
  Mail,
  Volume2
} from "lucide-react";

export const metadata: Metadata = {
  title: "Configurações - Falachefe",
  description: "Configure integrações, permissões e conecte seus serviços externos.",
};

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Configurações</h1>
            <p className="text-muted-foreground">
              Configure integrações, permissões e conecte seus serviços externos
            </p>
          </div>

          <div className="space-y-6">
            {/* Integrações do Google */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Integrações do Google
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="google-calendar">Google Calendar</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronize eventos e agendamentos com seu calendário
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Conectado</Badge>
                    <Switch id="google-calendar" defaultChecked />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="google-gmail">Google Gmail</Label>
                    <p className="text-sm text-muted-foreground">
                      Envie e receba emails através da plataforma
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Conectado</Badge>
                    <Switch id="google-gmail" defaultChecked />
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="google-drive">Google Drive</Label>
                    <p className="text-sm text-muted-foreground">
                      Acesse e compartilhe documentos automaticamente
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">Não conectado</Badge>
                    <Switch id="google-drive" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp Business */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="h-5 w-5" />
                  WhatsApp Business
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-connection">Conexão WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Conecte seu número autorizado para enviar e receber mensagens
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Conectado</Badge>
                    <Switch id="whatsapp-connection" defaultChecked />
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label htmlFor="whatsapp-number">Número Autorizado</Label>
                  <div className="flex gap-2">
                    <input
                      type="tel"
                      id="whatsapp-number"
                      placeholder="+55 11 99999-9999"
                      className="flex-1 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      defaultValue="+55 11 99999-9999"
                    />
                    <Button variant="outline">Verificar</Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Este número será usado para enviar e receber mensagens via WhatsApp
                  </p>
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-responses">Respostas Automáticas</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que agentes respondam automaticamente via WhatsApp
                    </p>
                  </div>
                  <Switch id="auto-responses" defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Permissões e Acessos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Permissões e Acessos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="calendar-access">Acesso ao Calendário</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite que agentes consultem e criem eventos
                    </p>
                  </div>
                  <Switch id="calendar-access" defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-access">Acesso ao Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite envio e leitura de emails pelos agentes
                    </p>
                  </div>
                  <Switch id="email-access" defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="contacts-access">Acesso aos Contatos</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite consulta e atualização da agenda de contatos
                    </p>
                  </div>
                  <Switch id="contacts-access" />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics-access">Acesso aos Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite análise de dados de conversas e performance
                    </p>
                  </div>
                  <Switch id="analytics-access" defaultChecked />
                </div>
              </CardContent>
            </Card>

            {/* Notificações */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notificações
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-notifications">Notificações por Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba relatórios e alertas importantes por email
                    </p>
                  </div>
                  <Switch id="email-notifications" defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="whatsapp-notifications">Notificações via WhatsApp</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba alertas urgentes no seu WhatsApp
                    </p>
                  </div>
                  <Switch id="whatsapp-notifications" defaultChecked />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="browser-notifications">Notificações do Navegador</Label>
                    <p className="text-sm text-muted-foreground">
                      Notificações em tempo real no navegador
                    </p>
                  </div>
                  <Switch id="browser-notifications" />
                </div>
              </CardContent>
            </Card>

            {/* Ações */}
            <div className="flex flex-col sm:flex-row justify-between items-center pt-6 gap-4">
              <Button variant="outline" className="w-full sm:w-auto">
                Restaurar Padrões
              </Button>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                <Button className="w-full sm:w-auto">Salvar Configurações</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
