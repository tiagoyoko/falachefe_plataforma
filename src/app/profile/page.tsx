"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Spinner } from "@/components/ui/spinner";
import { User, Mail, Calendar, Shield, Edit, Save, X } from "lucide-react";

interface OnboardingData {
  firstName: string;
  lastName: string;
  companyName: string;
  position: string;
  companySize: string;
  industry: string;
  whatsappPhone: string;
  isCompleted: boolean;
  completedAt?: string;
}

export default function ProfilePage() {
  const { data: session, isPending: isSessionPending } = useSession();
  const router = useRouter();
  
  // Estados para controle de edição
  const [isEditing, setIsEditing] = useState(false);
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState<OnboardingData | null>(null);

  // Dados capturados pela plataforma sobre o usuário e empresa
  const [userData, setUserData] = useState({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      position: "",
      department: "",
      image: null,
      role: "",
      memberSince: "",
      lastLogin: ""
    },
    companyInfo: {
      name: "",
      cnpj: "",
      industry: "",
      size: "",
      website: "",
      address: "",
      plan: "Professional"
    },
    preferences: {
      communicationStyle: "Direto e objetivo",
      preferredLanguage: "Português (Brasil)",
      timezone: "America/Sao_Paulo",
      businessHours: "09:00 - 18:00",
      notificationPreferences: "Email + WhatsApp"
    },
    dataInsights: {
      totalInteractions: 0,
      avgResponseTime: "0 minutos",
      satisfactionScore: 0,
      lastDataUpdate: ""
    }
  });

  // Carregar dados do usuário e onboarding
  useEffect(() => {
    const loadUserData = async () => {
      if (!isSessionPending && session) {
        setIsLoading(true);
        
        try {
          // Buscar dados de onboarding
          const onboardingRes = await fetch("/api/onboarding");
          if (onboardingRes.ok) {
            const onboarding = await onboardingRes.json();
            setOnboardingData(onboarding.data);
            
            // Atualizar dados do usuário com informações reais
            setUserData(prev => ({
              ...prev,
              personalInfo: {
                ...prev.personalInfo,
                name: `${onboarding.data.firstName} ${onboarding.data.lastName}`,
                email: session.user.email || "",
                phone: onboarding.data.whatsappPhone,
                position: onboarding.data.position,
                department: "",
                image: session.user.image || null,
                role: session.user.role || "user",
                memberSince: new Date(session.user.createdAt).toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric"
                }),
                lastLogin: "Hoje"
              },
              companyInfo: {
                ...prev.companyInfo,
                name: onboarding.data.companyName,
                industry: onboarding.data.industry,
                size: onboarding.data.companySize,
                address: "Não informado",
                plan: "Professional"
              },
              dataInsights: {
                ...prev.dataInsights,
                lastDataUpdate: onboarding.data.completedAt 
                  ? new Date(onboarding.data.completedAt).toLocaleString("pt-BR")
                  : "Não disponível"
              }
            }));
          }
        } catch (error) {
          console.error("Erro ao carregar dados:", error);
        } finally {
          setIsLoading(false);
        }
      } else if (!isSessionPending && !session) {
        router.push("/login");
      }
    };

    loadUserData();
  }, [session, isSessionPending, router]);

  // Mostrar loading enquanto carrega os dados
  if (isSessionPending || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Funções para gerenciar edição
  const handleEdit = (section: string) => {
    setEditingSection(section);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingSection(null);
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Aqui você faria a chamada para a API para salvar os dados
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simula delay da API
      
      setEditingSection(null);
      setIsEditing(false);
      // Aqui você poderia mostrar uma notificação de sucesso
    } catch (error) {
      console.error("Erro ao salvar:", error);
      // Aqui você poderia mostrar uma notificação de erro
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (section: string, field: string, value: string) => {
    setUserData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Dados Capturados</h1>
            <p className="text-muted-foreground">
              Visualize os dados pessoais, empresariais e preferências que a plataforma coletou sobre você
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Dados Principais */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Pessoais Capturadas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Dados Pessoais Capturados
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit('personalInfo')}
                      disabled={isEditing && editingSection !== 'personalInfo'}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    <Avatar className="h-20 w-20 flex-shrink-0">
                      <AvatarImage src={userData.personalInfo.image || undefined} />
                      <AvatarFallback className="text-2xl">
                        {userData.personalInfo.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center sm:text-left">
                      <h3 className="text-xl font-semibold">{userData.personalInfo.name}</h3>
                      <p className="text-muted-foreground">{userData.personalInfo.position} - {userData.personalInfo.department}</p>
                      <Badge variant="secondary" className="mt-2">
                        {userData.companyInfo.plan}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Nome Completo</Label>
                      {editingSection === 'personalInfo' ? (
                        <Input
                          id="name"
                          value={userData.personalInfo.name}
                          onChange={(e) => handleInputChange('personalInfo', 'name', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.personalInfo.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      {editingSection === 'personalInfo' ? (
                        <Input
                          id="email"
                          type="email"
                          value={userData.personalInfo.email}
                          onChange={(e) => handleInputChange('personalInfo', 'email', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.personalInfo.email}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="phone">Telefone</Label>
                      {editingSection === 'personalInfo' ? (
                        <Input
                          id="phone"
                          type="tel"
                          value={userData.personalInfo.phone}
                          onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.personalInfo.phone}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="position">Cargo</Label>
                      {editingSection === 'personalInfo' ? (
                        <Input
                          id="position"
                          value={userData.personalInfo.position}
                          onChange={(e) => handleInputChange('personalInfo', 'position', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.personalInfo.position}</p>
                      )}
                    </div>
                  </div>

                  {editingSection === 'personalInfo' && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dados da Empresa */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="h-5 w-5" />
                      Dados da Empresa
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit('companyInfo')}
                      disabled={isEditing && editingSection !== 'companyInfo'}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company-name">Nome da Empresa</Label>
                      {editingSection === 'companyInfo' ? (
                        <Input
                          id="company-name"
                          value={userData.companyInfo.name}
                          onChange={(e) => handleInputChange('companyInfo', 'name', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.companyInfo.name}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ</Label>
                      {editingSection === 'companyInfo' ? (
                        <Input
                          id="cnpj"
                          value={userData.companyInfo.cnpj}
                          onChange={(e) => handleInputChange('companyInfo', 'cnpj', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.companyInfo.cnpj}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="industry">Setor</Label>
                      {editingSection === 'companyInfo' ? (
                        <Input
                          id="industry"
                          value={userData.companyInfo.industry}
                          onChange={(e) => handleInputChange('companyInfo', 'industry', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.companyInfo.industry}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="size">Tamanho</Label>
                      {editingSection === 'companyInfo' ? (
                        <Input
                          id="size"
                          value={userData.companyInfo.size}
                          onChange={(e) => handleInputChange('companyInfo', 'size', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.companyInfo.size}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="website">Website</Label>
                      {editingSection === 'companyInfo' ? (
                        <Input
                          id="website"
                          type="url"
                          value={userData.companyInfo.website}
                          onChange={(e) => handleInputChange('companyInfo', 'website', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.companyInfo.website}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="address">Localização</Label>
                      {editingSection === 'companyInfo' ? (
                        <Input
                          id="address"
                          value={userData.companyInfo.address}
                          onChange={(e) => handleInputChange('companyInfo', 'address', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.companyInfo.address}</p>
                      )}
                    </div>
                  </div>

                  {editingSection === 'companyInfo' && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Preferências Identificadas */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Preferências Identificadas
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit('preferences')}
                      disabled={isEditing && editingSection !== 'preferences'}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="communication-style">Estilo de Comunicação</Label>
                      {editingSection === 'preferences' ? (
                        <Input
                          id="communication-style"
                          value={userData.preferences.communicationStyle}
                          onChange={(e) => handleInputChange('preferences', 'communicationStyle', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.preferences.communicationStyle}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="preferred-language">Idioma Preferido</Label>
                      {editingSection === 'preferences' ? (
                        <Input
                          id="preferred-language"
                          value={userData.preferences.preferredLanguage}
                          onChange={(e) => handleInputChange('preferences', 'preferredLanguage', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.preferences.preferredLanguage}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="timezone">Fuso Horário</Label>
                      {editingSection === 'preferences' ? (
                        <Input
                          id="timezone"
                          value={userData.preferences.timezone}
                          onChange={(e) => handleInputChange('preferences', 'timezone', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.preferences.timezone}</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="business-hours">Horário Comercial</Label>
                      {editingSection === 'preferences' ? (
                        <Input
                          id="business-hours"
                          value={userData.preferences.businessHours}
                          onChange={(e) => handleInputChange('preferences', 'businessHours', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.preferences.businessHours}</p>
                      )}
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="notification-preferences">Preferências de Notificação</Label>
                      {editingSection === 'preferences' ? (
                        <Input
                          id="notification-preferences"
                          value={userData.preferences.notificationPreferences}
                          onChange={(e) => handleInputChange('preferences', 'notificationPreferences', e.target.value)}
                          className="mt-1"
                        />
                      ) : (
                        <p className="mt-1 text-sm">{userData.preferences.notificationPreferences}</p>
                      )}
                    </div>
                  </div>

                  {editingSection === 'preferences' && (
                    <div className="flex flex-col sm:flex-row gap-2 pt-4">
                      <Button 
                        onClick={handleSave} 
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {isSaving ? "Salvando..." : "Salvar"}
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={isSaving}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancelar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Informações da Conta */}
              <Card>
                <CardHeader>
                  <CardTitle>Status da Conta</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Email Verificado</p>
                      <p className="text-xs text-green-600">✓ Verificado</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Membro desde</p>
                      <p className="text-xs text-muted-foreground">{userData.personalInfo.memberSince}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Função</p>
                      <p className="text-xs text-muted-foreground">{userData.personalInfo.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plano Atual */}
              <Card>
                <CardHeader>
                  <CardTitle>Plano Atual</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{userData.companyInfo.plan}</span>
                      <Badge variant="secondary">Ativo</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Renovação em 15 dias
                    </p>
                    <Button variant="outline" className="w-full">
                      Gerenciar Plano
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Insights dos Dados */}
              <Card>
                <CardHeader>
                  <CardTitle>Insights dos Dados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total de Interações</span>
                    <span className="font-medium">{userData.dataInsights.totalInteractions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Tempo Médio de Resposta</span>
                    <span className="font-medium">{userData.dataInsights.avgResponseTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Satisfação</span>
                    <span className="font-medium text-green-600">{userData.dataInsights.satisfactionScore}/5.0</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground">
                      Última atualização: {userData.dataInsights.lastDataUpdate}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Ações */}
              <Card>
                <CardHeader>
                  <CardTitle>Ações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full">
                    Exportar Dados
                  </Button>
                  <Button variant="outline" className="w-full">
                    Solicitar Correção
                  </Button>
                  <Button variant="outline" className="w-full">
                    Atualizar Informações
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