"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import Link from "next/link";

interface AuthButtonProps {
  href?: string;
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

export function AuthButton({ 
  href = "/dashboard", 
  children, 
  className,
  variant = "default",
  size = "lg"
}: AuthButtonProps) {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <Button disabled className={className} variant={variant} size={size}>
        Carregando...
      </Button>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!session) {
    return (
      <Button asChild className={className} variant={variant} size={size}>
        <Link href="/login">
          {children}
          <Zap className="ml-2 h-5 w-5" />
        </Link>
      </Button>
    );
  }

  // Se estiver autenticado, ir para o destino original
  return (
    <Button asChild className={className} variant={variant} size={size}>
      <Link href={href}>
        {children}
        <Zap className="ml-2 h-5 w-5" />
      </Link>
    </Button>
  );
}
