"use client";

import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function UserProfile() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return <div>Carregando...</div>;
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex items-center gap-3">
      <Avatar>
        <AvatarImage src={session.user.image || undefined} />
        <AvatarFallback>
          {session.user.name?.charAt(0)?.toUpperCase() || "U"}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col">
        <span className="text-sm font-medium">{session.user.name}</span>
        <span className="text-xs text-muted-foreground">{session.user.email}</span>
      </div>
    </div>
  );
}
