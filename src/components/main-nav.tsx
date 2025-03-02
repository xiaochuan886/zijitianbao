"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  Users,
  Settings,
  FileSpreadsheet,
  Receipt,
  ClipboardCheck,
  LineChart,
  BarChart3,
  FileDown,
  FileType,
  ChevronRight,
  ChevronDown,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Role } from "@/lib/enums"
import { useCurrentUser } from "@/hooks/use-current-user"
import { useState } from "react"

const navigation = [
  {
    title: "控制台",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "管理功能",
    icon: Settings,
    items: [
      {
        title: "机构管理",
        href: "/management/organizations",
        icon: Building2,
      },
      {
        title: "项目管理",
        href: "/management/projects",
        icon: FolderKanban,
      },
      {
        title: "资金需求类型",
        href: "/management/fund-types",
        icon: FileType,
      },
      {
        title: "用户权限",
        href: "/management/users",
        icon: Users,
      },
      {
        title: "系统设置",
        href: "/management/settings",
        icon: Settings,
      },
      {
        title: "项目关联管理",
        href: "/admin/project-links",
        icon: Building2,
        adminOnly: true,
      },
    ],
  },
  {
    title: "填报功能",
    icon: FileSpreadsheet,
    items: [
      {
        title: "资金需求预测",
        href: "/funding/predict",
        icon: FileSpreadsheet,
      },
      {
        title: "实际支付填报",
        href: "/funding/actual",
        icon: Receipt,
      },
      {
        title: "财务审核",
        href: "/funding/audit",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "数据功能",
    icon: BarChart3,
    items: [
      {
        title: "数据查询",
        href: "/analysis/query",
        icon: LineChart,
      },
      {
        title: "数据看板",
        href: "/analysis/dashboard",
        icon: BarChart3,
      },
      {
        title: "数据导出",
        href: "/analysis/export",
        icon: FileDown,
      },
    ],
  },
]

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  const { user } = useCurrentUser()
  const isAdmin = user?.role === Role.ADMIN
  
  // 预先展开当前路径所在的菜单
  const initialOpenItems = navigation
    .filter(item => item.items)
    .map(item => {
      const isActive = item.items?.some(subItem => 
        pathname.startsWith(subItem.href)
      )
      return isActive ? item.title : null
    })
    .filter(Boolean) as string[]
    
  const [openItems, setOpenItems] = useState<string[]>(initialOpenItems)
  
  const toggleItem = (title: string) => {
    setOpenItems(prev => 
      prev.includes(title) 
        ? prev.filter(item => item !== title)
        : [...prev, title]
    )
  }

  return (
    <nav
      className={cn("flex flex-col space-y-1", className)}
      {...props}
    >
      {navigation.map((item) => {
        if (!item.items) {
          // 单个菜单项，没有子菜单
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md",
                pathname === item.href 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              <span>{item.title}</span>
            </Link>
          )
        }

        // 带有子菜单的菜单组
        const isOpen = openItems.includes(item.title)
        const hasActiveChild = item.items.some(
          subItem => pathname.startsWith(subItem.href)
        )
        
        return (
          <div key={item.title} className="space-y-1">
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start px-3 py-2 text-sm font-medium rounded-md",
                isOpen || hasActiveChild 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
                "flex items-center gap-2"
              )}
              onClick={() => toggleItem(item.title)}
            >
              {item.icon && <item.icon className="h-5 w-5" />}
              <span className="flex-1 text-left">{item.title}</span>
              {isOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
            
            {isOpen && (
              <div className="ml-5 pl-2 border-l space-y-1">
                {item.items
                  .filter(subItem => !subItem.adminOnly || isAdmin)
                  .map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md",
                        pathname.startsWith(subItem.href)
                          ? "text-primary bg-primary/10"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}
                    >
                      {subItem.icon && <subItem.icon className="h-4 w-4" />}
                      <span>{subItem.title}</span>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )
}

