"use client";

import { signIn, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Chrome } from "lucide-react";
import Link from "next/link";

export function SignInButton() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <Button disabled>Carregando...</Button>;
  }

  if (session) {
    return null;
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button asChild>
        <Link href="/login">
          Entrar
        </Link>
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          await signIn.social({
            provider: "google",
            callbackURL: "/dashboard",
          });
        }}
      >
        <Chrome className="mr-2 h-4 w-4" />
        Google
      </Button>
    </div>
  );
}