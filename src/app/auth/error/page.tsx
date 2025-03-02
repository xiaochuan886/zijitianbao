"use client"

import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get("error")

  // 错误消息映射
  const errorMessages: Record<string, string> = {
    "CredentialsSignin": "邮箱或密码不正确，请重试",
    "SessionRequired": "您需要先登录",
    "AccessDenied": "您没有访问权限",
    "Default": "登录过程中出现错误，请重试"
  }

  // 获取错误消息，如果没有匹配则使用默认消息
  const errorMessage = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">认证错误</CardTitle>
        <CardDescription className="text-center">
          登录过程中出现了问题
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="p-4 mb-4 bg-destructive/10 text-destructive rounded-md">
          {errorMessage}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <Link href="/auth/login">
            返回登录
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
} 