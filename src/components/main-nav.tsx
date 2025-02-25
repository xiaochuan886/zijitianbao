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
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const navigation = [
  {
    title: "控制台",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "管理功能",
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
    ],
  },
  {
    title: "填报功能",
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

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-2">
      {navigation.map((item, index) => {
        if (!item.items) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                pathname === item.href ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          )
        }

        return (
          <Accordion
            key={item.title}
            type="single"
            collapsible
            defaultValue={item.items.some((subItem) => pathname.startsWith(subItem.href)) ? item.title : undefined}
          >
            <AccordionItem value={item.title} className="border-none">
              <AccordionTrigger className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50">
                {item.title}
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex flex-col gap-1 pl-6">
                  {item.items.map((subItem) => (
                    <Link
                      key={subItem.href}
                      href={subItem.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-500 transition-all hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50",
                        pathname === subItem.href ? "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-50" : "",
                      )}
                    >
                      <subItem.icon className="h-4 w-4" />
                      {subItem.title}
                    </Link>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )
      })}
    </nav>
  )
}

