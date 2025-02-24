import { Metadata } from "next"

export const metadata: Metadata = {
  title: "登录 - 资金计划填报系统",
  description: "登录到资金计划填报系统",
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {children}
    </div>
  )
} 