import { useEffect, useState } from "react"

interface User {
  id: string
  name: string | null
  email: string
  role: string
  organizationId: string | null
}

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  error: Error | null
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch("/api/auth/session")
        if (!response.ok) {
          throw new Error("获取用户信息失败")
        }
        const data = await response.json()
        setUser(data.user)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("未知错误"))
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  return {
    user,
    isLoading,
    error,
  }
} 