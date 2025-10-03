"use client";

import { useSession, signIn, signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

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
    <div className="flex items-center gap-2">
      <Button variant="outline" onClick={() => signIn.social({ provider: "google" })}>
        Entrar com Google
      </Button>
      <Button onClick={() => signIn.email({ email: "", password: "", callbackURL: "/dashboard" })}>
        Entrar
      </Button>
    </div>
  );
}
