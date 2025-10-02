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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir rotas públicas
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Permitir arquivos estáticos
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.includes(".") ||
    pathname.startsWith("/favicon")
  ) {
    return NextResponse.next();
  }

  try {
    // Verificar autenticação para rotas protegidas
    if (protectedRoutes.some(route => pathname.startsWith(route)) || 
        protectedApiRoutes.some(route => pathname.startsWith(route))) {
      
      const session = await auth.api.getSession({
        headers: request.headers,
      });

      if (!session) {
        // Redirecionar para login se não autenticado
        if (pathname.startsWith("/api/")) {
          return NextResponse.json(
            { error: "Não autorizado" },
            { status: 401 }
          );
        } else {
          const loginUrl = new URL("/login", request.url);
          loginUrl.searchParams.set("callbackUrl", pathname);
          return NextResponse.redirect(loginUrl);
        }
      }

      // Para rotas de API, verificar se é admin
      if (pathname.startsWith("/api/admin")) {
        // Aqui você pode adicionar verificação de role específica
        // Por enquanto, apenas verificar se está autenticado
        return NextResponse.next();
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
