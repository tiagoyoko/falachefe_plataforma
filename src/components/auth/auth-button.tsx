"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthButton() {
  // Versão simplificada que sempre mostra "Entrar"
  // O Better Auth está com problemas de configuração
  return (
    <Button asChild size="lg" className="text-lg px-8 py-6">
      <Link href="/login">
        Entrar
      </Link>
    </Button>
  );
}
