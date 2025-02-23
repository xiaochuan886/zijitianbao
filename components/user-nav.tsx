'use client'

import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/app/components/auth-provider"
import { toast } from "@/app/components/ui/use-toast"

export function UserNav() {
  const router = useRouter()
  const { user } = useAuth()

  // 如果用户未登录，不显示用户导航
  if (!user) return null

  // 获取用户名首字母作为头像
  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  // 处理退出登录
  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('退出登录失败')
      }

      // 清除本地状态并跳转到登录页
      router.push('/login')
      toast({
        title: "退出成功",
        description: "您已安全退出系统",
      })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "退出失败",
        description: "请稍后重试",
      })
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/avatars/01.png" alt={user.name || user.email} />
            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name || '未设置姓名'}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={() => router.push('/profile')}>
            个人信息
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push('/settings')}>
            系统设置
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-red-600 focus:text-red-600" onSelect={handleLogout}>
          退出登录
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

