"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth/auth-client";
import { UserProfile } from "@/components/auth/user-profile";
import { ModeToggle } from "./ui/mode-toggle";
import { Button } from "./ui/button";
import { MessageSquare, Bot, BarChart3, Users, Info, Target, HelpCircle } from "lucide-react";

export function SiteHeader() {
  const { data: session } = useSession();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
          >
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
              <MessageSquare className="h-6 w-6" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Falachefe
            </span>
          </Link>

          {/* Navigation - Diferente para usuários logados e não logados */}
          <nav className="hidden md:flex items-center gap-6">
            {session?.user ? (
              // Navegação para usuários logados (páginas internas)
              <>
                <Link 
                  href="/dashboard" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link 
                  href="/agentes" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Bot className="h-4 w-4" />
                  Agentes
                </Link>
                <Link 
                  href="/assinantes" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Users className="h-4 w-4" />
                  Assinantes
                </Link>
                <Link 
                  href="/templates" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <MessageSquare className="h-4 w-4" />
                  Templates
                </Link>
              </>
            ) : (
              // Navegação para usuários não logados (páginas de marketing)
              <>
                <Link 
                  href="/sobre" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Info className="h-4 w-4" />
                  Sobre
                </Link>
                <Link 
                  href="/solucoes" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Target className="h-4 w-4" />
                  Soluções
                </Link>
                <Link 
                  href="/precos" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <BarChart3 className="h-4 w-4" />
                  Preços
                </Link>
                <Link 
                  href="/contato" 
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <HelpCircle className="h-4 w-4" />
                  Contato
                </Link>
              </>
            )}
          </nav>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            {!session?.user && (
              <div className="hidden sm:block">
                <Button asChild variant="outline" size="sm">
                  <Link href="/demo">
                    Ver Demo
                  </Link>
                </Button>
              </div>
            )}
            <UserProfile />
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}