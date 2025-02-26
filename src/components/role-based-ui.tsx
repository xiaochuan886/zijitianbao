import type * as React from "react"
import { useAuth } from "@/lib/auth"

interface RoleBasedUIProps {
  roles: string[]
  children: React.ReactNode
}

export function RoleBasedUI({ roles, children }: RoleBasedUIProps) {
  // 暂时禁用角色检查，直接返回内容
  // const { user } = useAuth()
  // 
  // if (!user || !roles.includes(user.role)) {
  //   return null
  // }
  
  return <>{children}</>
}

