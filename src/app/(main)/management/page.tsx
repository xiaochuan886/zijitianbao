"use client"

import Link from "next/link"
import {
  Building2,
  FolderKanban,
  Users,
  Settings,
  FileType,
  ArrowRight,
  Undo2
} from "lucide-react"

interface ManagementCardProps {
  title: string
  description: string
  icon: React.ElementType
  href: string
}

function ManagementCard({ title, description, icon: Icon, href }: ManagementCardProps) {
  return (
    <Link
      href={href}
      className="block p-6 bg-white dark:bg-gray-950 rounded-lg shadow hover:shadow-md transition-all border border-gray-200 dark:border-gray-800"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
          </div>
        </div>
        <ArrowRight className="h-5 w-5 text-gray-400" />
      </div>
    </Link>
  )
}

export default function ManagementPage() {
  const managementModules = [
    {
      title: "机构管理",
      description: "管理系统中的组织机构和部门信息",
      icon: Building2,
      href: "/management/organizations"
    },
    {
      title: "项目管理",
      description: "管理各类项目及子项目信息",
      icon: FolderKanban,
      href: "/management/projects"
    },
    {
      title: "资金需求类型",
      description: "管理项目资金需求类型分类",
      icon: FileType,
      href: "/management/fund-types"
    },
    {
      title: "用户权限",
      description: "管理系统用户及其权限配置",
      icon: Users,
      href: "/management/users"
    },
    {
      title: "撤回配置",
      description: "管理各模块的撤回功能配置",
      icon: Undo2,
      href: "/management/withdrawal-config"
    },
    {
      title: "系统设置",
      description: "配置系统基本参数和选项",
      icon: Settings,
      href: "/management/settings"
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">管理功能</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          通过以下管理模块，可以配置和管理系统中的各类基础数据
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {managementModules.map((module) => (
          <ManagementCard
            key={module.href}
            title={module.title}
            description={module.description}
            icon={module.icon}
            href={module.href}
          />
        ))}
      </div>
    </div>
  )
} 