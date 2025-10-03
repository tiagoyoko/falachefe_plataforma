import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Rotas que requerem autenticação
const protectedRoutes = [
  "/dashboard",
  "/agents",
  "/subscribers", 
  "/templates",
  "/profile",
  "/admin",
  "/settings"
];

// Rotas que são públicas
const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/auth"
];

// Rotas de API que requerem autenticação
const protectedApiRoutes = [
  "/api/admin",
  "/api/agents",
  "/api/conversations",
  "/api/templates",
  "/api/users",
  "/api/companies"
];

// Rotas de API do Better Auth (sempre permitidas)
const authApiRoutes = [
  "/api/auth/sign-in",
  "/api/auth/sign-up", 
  "/api/auth/sign-out",
  "/api/auth/session",
  "/api/auth/callback"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir arquivos estáticos e rotas de autenticação
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon") ||
    authApiRoutes.some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  try {
    // Verificar autenticação para rotas protegidas
    if (protectedRoutes.some(route => pathname.startsWith(route)) || 
        protectedApiRoutes.some(route => pathname.startsWith(route))) {
      
      // Usar o método correto do Better Auth conforme documentação
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session?.user) {
        // Redirecionar para login se não autenticado
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Não autorizado", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        } else {
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(loginUrl);
        }
      }

      // Verificar se usuário está ativo (usar propriedades disponíveis no Better Auth)
      // Nota: isActive e role são campos customizados que precisam ser estendidos
      // Por enquanto, apenas verificar se a sessão é válida
      
      // Para rotas de admin, verificar se usuário tem permissão
      if (pathname.startsWith("/api/admin")) {
        // TODO: Implementar verificação de role quando estendermos os tipos do Better Auth
        // Por enquanto, permitir acesso a usuários autenticados
        console.log(`Acesso admin para usuário: ${session.user.email}`)
      }
    }

    return NextResponse.next();
  } catch (error) {
    // Log de erro sem expor dados sensíveis
    console.error("Erro no middleware de autenticação:", {
      message: error instanceof Error ? error.message : "Erro desconhecido",
      path: pathname,
      timestamp: new Date().toISOString()
    });
    
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    } else {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
