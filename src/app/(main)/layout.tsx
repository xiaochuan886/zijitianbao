"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  useEffect(() => {
    // 检查是否已登录
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/login")
    }
  }, [router])

  return (
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

            {/* Theme Toggle */}
            <div className="p-4 border-t flex justify-center">
              <ThemeToggle />
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
  )
} 