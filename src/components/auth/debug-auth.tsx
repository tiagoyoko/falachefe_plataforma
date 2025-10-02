"use client";

import { useSession, signIn } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Chrome } from "lucide-react";
import { useState } from "react";

export function DebugAuth() {
  const { data: session, isPending } = useSession();
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    
    try {
      console.log("🔄 Iniciando login com Google...");
      
      const result = await signIn.social({
        provider: "google",
        callbackURL: "/dashboard",
      });
      
      console.log("✅ Resultado do login:", result);
      
      if (result.error) {
        setError(`Erro: ${result.error.message}`);
        console.error("❌ Erro no login:", result.error);
      } else {
        console.log("🎉 Login realizado com sucesso!");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(`Erro inesperado: ${errorMessage}`);
      console.error("❌ Erro inesperado:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Debug de Autenticação</CardTitle>
        <CardDescription>
          Teste do sistema de autenticação Better Auth
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">Status da Sessão:</h4>
          {isPending ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : session ? (
            <div className="space-y-1">
              <p className="text-green-600">✅ Autenticado</p>
              <p className="text-sm text-muted-foreground">
                Email: {session.user?.email}
              </p>
              <p className="text-sm text-muted-foreground">
                Nome: {session.user?.name}
              </p>
            </div>
          ) : (
            <p className="text-muted-foreground">❌ Não autenticado</p>
          )}
        </div>

        <div>
          <h4 className="font-medium mb-2">Teste de Login:</h4>
          <Button
            onClick={handleGoogleLogin}
            disabled={loading || isPending}
            className="w-full"
          >
            <Chrome className="mr-2 h-4 w-4" />
            {loading ? "Conectando..." : "Login com Google"}
          </Button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          <p><strong>Redirect URI:</strong> http://localhost:3000/api/auth/callback/google</p>
          <p><strong>Base URL:</strong> {process.env.NEXT_PUBLIC_APP_URL}</p>
        </div>
      </CardContent>
    </Card>
  );
}
