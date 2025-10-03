"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Users, ArrowRight } from "lucide-react";
import { useSession } from "@/lib/auth-client";

export default function AssinantesPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Redirecionar para a página de gestão de usuários se estiver logado
  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace('/admin/users');
    }
  }, [session, isPending, router]);

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
          <h1 className="text-2xl font-bold mb-2">Carregando...</h1>
          <p className="text-muted-foreground">
            Verificando autenticação...
          </p>
        </div>
      </div>
    );
  }

  // Se não estiver logado, mostrar página de login
  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Você precisa fazer login para acessar a gestão de assinantes
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={() => router.push('/login')}>
              Fazer Login
            </Button>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Voltar ao Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Página de redirecionamento
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto text-center">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              Gestão de Assinantes
            </CardTitle>
            <CardDescription>
              Redirecionando para a página de gestão de usuários...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center gap-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Carregando página de gestão...</span>
            </div>
            <Button 
              onClick={() => router.push('/admin/users')}
              className="w-full"
            >
              <Users className="w-4 h-4 mr-2" />
              Acessar Gestão de Assinantes
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
