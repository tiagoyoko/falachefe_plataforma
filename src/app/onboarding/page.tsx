"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Loader2, ArrowLeft, ArrowRight, User, Building, Phone } from "lucide-react";
import { OnboardingData } from "@/types";

const ONBOARDING_STEPS = [
  {
    id: "personal",
    title: "Dados Pessoais",
    description: "Vamos começar com suas informações básicas",
    icon: User,
  },
  {
    id: "company",
    title: "Informações da Empresa",
    description: "Conte-nos sobre sua empresa",
    icon: Building,
  },
  {
    id: "contact",
    title: "Contato WhatsApp",
    description: "Configure seu número para receber mensagens",
    icon: Phone,
  },
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 funcionários" },
  { value: "11-50", label: "11-50 funcionários" },
  { value: "51-200", label: "51-200 funcionários" },
  { value: "201-1000", label: "201-1000 funcionários" },
  { value: "1000+", label: "Mais de 1000 funcionários" },
];

const INDUSTRIES = [
  "Tecnologia",
  "Saúde",
  "Educação",
  "Finanças",
  "Varejo",
  "E-commerce",
  "Consultoria",
  "Marketing",
  "Imobiliário",
  "Alimentação",
  "Turismo",
  "Automotivo",
  "Construção",
  "Agricultura",
  "Outros",
];

export default function OnboardingPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    firstName: "",
    lastName: "",
    companyName: "",
    position: "",
    companySize: "1-10",
    industry: "",
    whatsappPhone: "",
  });

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateCurrentStep = (): boolean => {
    const step = ONBOARDING_STEPS[currentStep];
    
    switch (step.id) {
      case "personal":
        return !!(formData.firstName && formData.lastName);
      case "company":
        return !!(formData.companyName && formData.position && formData.industry);
      case "contact":
        return !!(formData.whatsappPhone);
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isCompleted: true,
          completedAt: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      } else {
        const error = await response.json();
        console.error('Erro ao salvar onboarding:', error);
        // TODO: Mostrar erro para o usuário
      }
    } catch (error) {
      console.error('Erro ao salvar onboarding:', error);
      // TODO: Mostrar erro para o usuário
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    router.push('/login');
    return null;
  }

  const currentStepData = ONBOARDING_STEPS[currentStep];
  const Icon = currentStepData.icon;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10">
              <Icon className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Configuração Inicial</h1>
          </div>
          <p className="text-muted-foreground">
            Vamos personalizar sua experiência com os agentes de IA
          </p>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Etapa {currentStep + 1} de {ONBOARDING_STEPS.length}</span>
            <span>{Math.round(progress)}% concluído</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Current Step */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              {currentStepData.title}
            </CardTitle>
            <CardDescription>{currentStepData.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStepData.id === "personal" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nome *</Label>
                  <Input
                    id="firstName"
                    placeholder="Seu nome"
                    value={formData.firstName || ""}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Sobrenome *</Label>
                  <Input
                    id="lastName"
                    placeholder="Seu sobrenome"
                    value={formData.lastName || ""}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>
            )}

            {currentStepData.id === "company" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Nome da Empresa *</Label>
                  <Input
                    id="companyName"
                    placeholder="Nome da sua empresa"
                    value={formData.companyName || ""}
                    onChange={(e) => handleInputChange("companyName", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Seu Cargo *</Label>
                  <Input
                    id="position"
                    placeholder="Ex: CEO, Gerente, Diretor"
                    value={formData.position || ""}
                    onChange={(e) => handleInputChange("position", e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tamanho da Empresa *</Label>
                    <Select
                      value={formData.companySize || "1-10"}
                      onValueChange={(value) => handleInputChange("companySize", value as any)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tamanho" />
                      </SelectTrigger>
                      <SelectContent>
                        {COMPANY_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Ramo da Empresa *</Label>
                    <Select
                      value={formData.industry || ""}
                      onValueChange={(value) => handleInputChange("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o ramo" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>
                            {industry}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {currentStepData.id === "contact" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="whatsappPhone">Telefone WhatsApp *</Label>
                  <Input
                    id="whatsappPhone"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsappPhone || ""}
                    onChange={(e) => handleInputChange("whatsappPhone", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Este número será usado para autorizar o recebimento e envio de mensagens via WhatsApp
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>

              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateCurrentStep() || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Finalizando...
                    </>
                  ) : (
                    "Finalizar Configuração"
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!validateCurrentStep()}
                >
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
