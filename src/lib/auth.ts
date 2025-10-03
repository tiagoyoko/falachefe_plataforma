import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { admin, anonymous } from "better-auth/plugins"
import { db } from "./db"
import * as betterAuthSchema from "./better-auth-schema"

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: betterAuthSchema,
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account", // Sempre pedir para selecionar conta
      accessType: "offline", // Sempre obter refresh token
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin(), // Plugin para administração de usuários
    anonymous(), // Plugin para usuários anônimos
  ],
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  logger: {
    level: "error", // Sempre error para não expor dados sensíveis
  },
  // Configurações adicionais conforme documentação
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 dias
    updateAge: 60 * 60 * 24, // Atualizar a cada 24h
  },
  // Configuração de email (se necessário)
  emailVerification: {
    sendVerificationEmail: async (data: { user: { id: string; email: string; name: string }; url: string; token: string }) => {
      // Implementar envio de email de verificação
      console.log(`Email de verificação para: ${data.user.email}`)
      // TODO: Integrar com serviço de email (Resend, SendGrid, etc.)
    },
  },
})