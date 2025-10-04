import { NextRequest, NextResponse } from "next/server"

export function getCorsHeaders(origin?: string) {
  const allowedOrigins = [
    'https://falachefe-plataforma-dq7j.vercel.app',
    'https://falachefe.app.br',
    'http://localhost:3000',
    'http://localhost:3001'
  ]

  const allowedOrigin = origin && allowedOrigins.includes(origin) 
    ? origin 
    : 'https://falachefe.app.br'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  }
}

export function handleCors(req: NextRequest) {
  const origin = req.headers.get('origin') || undefined
  const corsHeaders = getCorsHeaders(origin)

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return new NextResponse(null, { 
      status: 200, 
      headers: corsHeaders 
    })
  }

  return corsHeaders
}

export function withCors(response: NextResponse, origin?: string) {
  const corsHeaders = getCorsHeaders(origin)
  
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })
  
  return response
}
