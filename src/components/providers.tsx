"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"
import { useState } from "react"
import { AuthProvider } from "@/lib/auth"

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
          <Toaster richColors />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}