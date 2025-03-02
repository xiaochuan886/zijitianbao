"use client"

import { useState } from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Edit, Eye, Archive, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Project } from "./page"
import { Badge } from "@/components/ui/badge"

interface ProjectActionsProps {
  onEdit?: (project: Project) => void
  onView?: (project: Project) => void
  onArchive?: (project: Project) => void
}

// 折叠子项目组件
function CollapsibleSubProjects({ project }: { project: Project }) {
  const [isOpen, setIsOpen] = useState(false)
  
  // 按资金需求类型对子项目数据进行聚合
  const groupByFundType = (subProject: Project['subProjects'][0]) => {
    const groups: Record<string, Set<string>> = {};
    
    subProject.detailedFundNeeds.forEach(need => {
      if (!groups[need.fundType.name]) {
        groups[need.fundType.name] = new Set();
      }
      groups[need.fundType.name].add(need.department.name);
    });
    
    return Object.entries(groups).map(([fundTypeName, departments]) => ({
      fundTypeName,
      departments: Array.from(departments)
    }));
  };
  
  return (
    <div>
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-5 w-5 rounded-full p-0"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900 dark:text-blue-100">
          {project.subProjects?.length || 0} 个子项目
        </Badge>
      </div>
      
      {isOpen && project.subProjects?.length > 0 && (
        <div className="pl-6 mt-2 space-y-2">
          {project.subProjects.map((subProject) => (
            <div key={subProject.id} className="border p-2 rounded-md bg-slate-50 dark:bg-slate-800 text-sm">
              <div className="flex flex-col gap-1">
                <div className="font-medium">{subProject.name}</div>
                
                {subProject.detailedFundNeeds && subProject.detailedFundNeeds.length > 0 ? (
                  <div className="mt-1">
                    {groupByFundType(subProject).map((group, i) => (
                      <div key={i} className="mb-1.5">
                        <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900 dark:text-purple-100 text-xs mb-1">
                          {group.fundTypeName}
                        </Badge>
                        <div className="pl-2 text-xs text-gray-600 dark:text-gray-300">
                          部门: {group.departments.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400">未关联资金需求类型</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export const columns = ({ 
  onEdit, 
  onView, 
  onArchive 
}: ProjectActionsProps): ColumnDef<Project>[] => [
  {
    accessorKey: "name",
    header: "项目名称",
  },
  {
    accessorKey: "code",
    header: "项目编码",
  },
  {
    accessorKey: "organizations",
    header: "关联机构",
    cell: ({ row }) => {
      const project = row.original;
      
      // 从所有子项目的detailedFundNeeds中提取唯一的组织
      const uniqueOrganizations = new Set<string>();
      const organizationMap: Record<string, string> = {};
      
      project.subProjects.forEach(subProject => {
        subProject.detailedFundNeeds.forEach(need => {
          if (need.organization) {
            uniqueOrganizations.add(need.organization.id);
            organizationMap[need.organization.id] = need.organization.name;
          }
        });
      });
      
      const organizationCount = uniqueOrganizations.size;
      
      if (organizationCount === 0) {
        return <span className="text-muted-foreground text-sm">未关联机构</span>;
      }
      
      // 限制显示的机构数量，避免太长
      const orgNames = Array.from(uniqueOrganizations)
        .slice(0, 2)
        .map(id => organizationMap[id]);
      
      return (
        <div className="flex flex-col gap-1">
          {orgNames.map((name, index) => (
            <Badge key={index} variant="outline" className="bg-blue-50 dark:bg-blue-900 dark:text-blue-100 max-w-[180px] truncate">
              {name}
            </Badge>
          ))}
          {organizationCount > 2 && (
            <span className="text-xs text-muted-foreground">
              共 {organizationCount} 个机构
            </span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: "项目分类",
    cell: ({ row }) => (
      <span>
        {row.original.category ? (
          <Badge variant="outline" className="bg-purple-50 dark:bg-purple-900 dark:text-purple-100">
            {row.original.category.name}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-sm">未分类</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => (
      <Badge
        variant={row.original.status === "ACTIVE" ? "default" : "secondary"}
        className={row.original.status === "ACTIVE" 
          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100" 
          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"}
      >
        {row.original.status === "ACTIVE" ? "活跃" : "已归档"}
      </Badge>
    ),
  },
  {
    accessorKey: "startYear",
    header: "开始年份",
  },
  {
    accessorKey: "subProjects",
    header: "子项目",
    cell: ({ row }) => <CollapsibleSubProjects project={row.original} />,
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const project = row.original

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
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(project.id)}>
              复制项目ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit && onEdit(project)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑项目
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onView && onView(project)}>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onArchive && onArchive(project)}>
              <Archive className="mr-2 h-4 w-4" />
              {project.status === "ACTIVE" ? "归档项目" : "激活项目"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

