"use client";

import { useSession, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Button disabled>Carregando...</Button>;
  }

  if (session?.user) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          Olá, {session.user.name}
        </span>
        <Button variant="outline" onClick={() => signOut()}>
          Sair
        </Button>
      </div>
    );
  }

  return (
    <Button asChild size="lg" className="text-lg px-8 py-6">
      <Link href="/login">
        Entrar
      </Link>
    </Button>
  );
}
