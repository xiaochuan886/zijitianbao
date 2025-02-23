"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EditOrgDialog } from "./components/EditOrgDialog"
import { DepartmentPanel } from "./components/DepartmentPanel"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface Organization {
  id: number
  name: string
  code: string
  departments: number
  projects: number
}

interface DataTableProps {
  data: Organization[]
  onSuccess: () => void
  isAdmin?: boolean
}

export function createColumns({ onSuccess, isAdmin = false }: DataTableProps): ColumnDef<Organization>[] {
  const router = useRouter()

  return [
    {
      accessorKey: "name",
      header: "机构名称",
    },
    {
      accessorKey: "code",
      header: "机构编码",
    },
    {
      accessorKey: "departments",
      header: "部门数量",
      cell: ({ row }) => {
        const organization = row.original
        return (
          <div className="flex items-center space-x-2">
            <span>{organization.departments}</span>
            {isAdmin ? (
              <DepartmentPanel
                organization={organization}
                onSuccess={onSuccess}
                trigger={
                  <Button variant="ghost" size="icon">
                    <Building2 className="h-4 w-4" />
                  </Button>
                }
              />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(`/management/organizations/${organization.id}/departments`)}
              >
                <Building2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: "projects",
      header: "项目数量",
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const organization = row.original

        const handleDelete = async () => {
          try {
            // 检查依赖关系
            const dependencyResponse = await fetch(
              `/api/organizations/${organization.id}/dependencies`
            )
            
            if (!dependencyResponse.ok) {
              throw new Error("检查依赖关系失败")
            }

            const { hasDependencies, details } = await dependencyResponse.json()
            
            if (hasDependencies) {
              toast.error(
                `无法删除机构，存在关联项目：${details.projects.join(", ")}`
              )
              return
            }

            // 执行删除操作
            const response = await fetch(`/api/organizations/${organization.id}`, {
              method: "DELETE",
            })

            if (!response.ok) {
              const error = await response.json()
              throw new Error(error.message || "删除机构失败")
            }

            toast.success("机构删除成功")
            onSuccess()
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "删除机构失败")
          }
        }

        if (!isAdmin) {
          return null
        }

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(organization.id.toString())}>
                复制机构ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <EditOrgDialog
                organization={organization}
                onSuccess={onSuccess}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    编辑机构信息
                  </DropdownMenuItem>
                }
              />
              <DepartmentPanel
                organization={organization}
                onSuccess={onSuccess}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    管理部门
                  </DropdownMenuItem>
                }
              />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    删除机构
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>确认删除</AlertDialogTitle>
                    <AlertDialogDescription>
                      确定要删除机构 "{organization.name}" 吗？此操作不可撤销。
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>取消</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      删除
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}

