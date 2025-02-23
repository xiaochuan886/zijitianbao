import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { toast } from "sonner"

export function withAdminPermission<T extends object>(
  WrappedComponent: React.ComponentType<T>
) {
  return function WithAdminPermissionComponent(props: T) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
      if (!isLoading && (!user || user.role !== "ADMIN")) {
        toast.error("您没有权限访问此页面")
        router.push("/dashboard")
      }
    }, [user, isLoading, router])

    if (isLoading) {
      return <div>加载中...</div>
    }

    if (!user || user.role !== "ADMIN") {
      return null
    }

    return <WrappedComponent {...props} />
  }
} 