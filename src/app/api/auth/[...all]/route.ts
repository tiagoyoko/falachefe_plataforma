import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"
import { NextRequest, NextResponse } from "next/server"
import { handleCors, withCors } from "@/lib/cors"

// Handler do Better Auth
const handler = toNextJsHandler(auth)

// Wrapper para adicionar headers CORS
function withCORSHandler(handler: any) {
  return async (req: NextRequest) => {
    // Handle CORS preflight
    const corsResponse = handleCors(req)
    if (corsResponse instanceof NextResponse) {
      return corsResponse
    }

    try {
      // Executar handler original
      const response = await handler(req)
      
      // Adicionar headers CORS à resposta
      return withCors(response, req.headers.get('origin') || undefined)
    } catch (error) {
      console.error('Auth handler error:', error)
      const errorResponse = new NextResponse(
        JSON.stringify({ error: 'Internal Server Error' }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json'
          } 
        }
      )
      return withCors(errorResponse, req.headers.get('origin') || undefined)
    }
  }
}

export const GET = withCORSHandler(handler.GET)
export const POST = withCORSHandler(handler.POST)