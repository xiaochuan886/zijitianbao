import type React from "react"
import "@/styles/globals.css"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/lib/auth"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "资金计划填报系统",
  description: "专业的资金填报及管理系统",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <AuthProvider>
            <div className="min-h-screen bg-background">
              <div className="flex h-screen">
                {/* Sidebar */}
                <div className="hidden lg:flex lg:w-72 lg:flex-col lg:fixed lg:inset-y-0 bg-card border-r">
                  <div className="flex flex-col flex-grow">
                    {/* Logo */}
                    <div className="h-16 flex items-center gap-2 px-6 border-b">
                      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-lg font-bold text-white">F</span>
                      </div>
                      <span className="text-lg font-semibold">资金计划填报系统</span>
                    </div>

                    {/* Navigation */}
                    <div className="flex-1 flex flex-col min-h-0 p-4">
                      <MainNav />
                    </div>

                    {/* User */}
                    <div className="p-4 border-t">
                      <UserNav />
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="lg:pl-72 flex flex-col flex-1">
                  {/* Top Bar */}
                  <header className="sticky top-0 z-10 h-16 flex items-center gap-4 border-b bg-background/95 backdrop-blur px-6">
                    <div className="flex-1" />
                    <UserNav />
                  </header>

                  {/* Page Content */}
                  <main className="flex-1 p-6">{children}</main>
                </div>
              </div>
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}



import './globals.css'