import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || (process.env.NODE_ENV === 'production' ? 'https://falachefe-plataforma-dq7j.vercel.app' : 'http://localhost:3000'),
  fetchOptions: {
    onError: (ctx) => {
      console.error("Auth client error:", ctx.error);
    },
  },
})

export const {
  signIn,
  signOut,
  signUp,
  useSession,
  getSession,
} = authClient