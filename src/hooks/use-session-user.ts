'use client'

import { useEffect, useState } from 'react'

interface SessionUser {
  id: string
  email: string
  name: string
  image?: string | null
  createdAt: Date
  updatedAt: Date
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isPending, setIsPending] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/get-session')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setUser(data.user)
            setIsAuthenticated(true)
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
      } finally {
        setIsPending(false)
      }
    }

    checkSession()
  }, [])

  return {
    user,
    isPending,
    isAuthenticated
  }
}
