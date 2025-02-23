import { ThemeProvider } from '@/app/components/theme-provider'
import { AuthProvider } from '@/app/components/auth-provider'
import { ToastProvider, ToastViewport } from '@/app/components/ui/toast'
import { MainNav } from '@/components/main-nav'
import { UserNav } from '@/components/user-nav'

// 主应用布局：包含所有需要认证和完整UI的页面
export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <AuthProvider>
        <ToastProvider>
          <div className="relative min-h-screen">
            {/* 左侧导航 */}
            <div className="fixed inset-y-0 left-0 w-64 border-r border-border bg-card">
              <div className="flex h-16 items-center px-6 border-b border-border">
                <h2 className="text-lg font-semibold">资金计划填报系统</h2>
              </div>
              <MainNav className="px-3 py-4" />
            </div>
            
            {/* 主内容区 */}
            <div className="pl-64">
              {/* 顶部导航栏 */}
              <header className="sticky top-0 z-40 h-16 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-end px-6">
                  <UserNav />
                </div>
              </header>

              {/* 页面内容 */}
              <main className="p-6">
                {children}
              </main>
            </div>
          </div>
          <ToastViewport />
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
} 