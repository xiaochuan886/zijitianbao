"use client"

import { useCallback, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Combobox } from "@/components/ui/combobox"
import { RotateCcw, Search } from "lucide-react"

export interface FilterCardProps {
  filters: {
    organization: string
    department: string
    category?: string
    project: string
    subProject?: string
    fundType?: string
    status: string
  }
  organizations: { id: string; name: string }[]
  departments: { id: string; name: string }[]
  categories?: { id: string; name: string }[]
  projects?: { id: string; name: string; categoryId?: string }[]
  subProjects?: { id: string; name: string; projectId: string }[]
  fundTypes?: { id: string; name: string }[]
  loading?: boolean
  showOrganization?: boolean
  showDepartment?: boolean
  showCategory?: boolean
  showProject?: boolean
  showSubProject?: boolean
  showFundType?: boolean
  showStatus?: boolean
  onFilterChange: (filters: any) => void
  onReset: () => void
  onSearch: () => void
}

export function FilterCard({
  filters,
  organizations,
  departments,
  categories = [],
  projects = [],
  subProjects = [],
  fundTypes = [],
  loading,
  showOrganization = true,
  showDepartment = true,
  showCategory = true,
  showProject = true,
  showSubProject = true,
  showFundType = true,
  showStatus = true,
  onFilterChange,
  onReset,
  onSearch,
}: FilterCardProps) {
  // 处理筛选条件变更
  const handleFilterChange = useCallback(
    (key: string, value: any) => {
      // 如果是机构变更，需要清空部门
      if (key === "organization") {
        onFilterChange({
          ...filters,
          organization: value,
          department: "all",
        })
        return
      }

      // 如果是项目变更，需要清空子项目
      if (key === "project") {
        onFilterChange({
          ...filters,
          project: value,
          subProject: "all",
        })
        return
      }

      onFilterChange({
        ...filters,
        [key]: value,
      })
    },
    [filters, onFilterChange]
  )

  // 获取当前项目可用的子项目
  const availableSubProjects = useMemo(() => {
    if (!filters.project || filters.project === "all") return subProjects
    return subProjects.filter(sub => {
      const project = projects.find(p => p.id === filters.project)
      return project && sub.projectId === project.id
    })
  }, [filters.project, projects, subProjects])

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {showOrganization && (
            <div>
              <label className="text-sm font-medium">机构</label>
              <Combobox
                options={[
                  { value: "all", label: "全部机构" },
                  ...organizations.map((org) => ({
                    value: org.id,
                    label: org.name,
                  })),
                ]}
                value={filters.organization}
                onChange={(value) => handleFilterChange("organization", value)}
                placeholder="选择机构"
              />
            </div>
          )}

          {showDepartment && (
            <div>
              <label className="text-sm font-medium">部门</label>
              <Combobox
                options={[
                  { value: "all", label: "全部部门" },
                  ...departments.map((dept) => ({
                    value: dept.id,
                    label: dept.name,
                  })),
                ]}
                value={filters.department}
                onChange={(value) => handleFilterChange("department", value)}
                placeholder="选择部门"
              />
            </div>
          )}

          {showCategory && (
            <div>
              <label className="text-sm font-medium">项目分类</label>
              <Combobox
                options={[
                  { value: "all", label: "全部分类" },
                  ...categories.map((cat) => ({
                    value: cat.id,
                    label: cat.name,
                  })),
                ]}
                value={filters.category || "all"}
                onChange={(value) => handleFilterChange("category", value)}
                placeholder="选择项目分类"
              />
            </div>
          )}

          {showProject && (
            <div>
              <label className="text-sm font-medium">项目</label>
              <Combobox
                options={[
                  { value: "all", label: "全部项目" },
                  ...projects.map((proj) => ({
                    value: proj.id,
                    label: proj.name,
                  })),
                ]}
                value={filters.project}
                onChange={(value) => handleFilterChange("project", value)}
                placeholder="选择项目"
              />
            </div>
          )}

          {showSubProject && (
            <div>
              <label className="text-sm font-medium">子项目</label>
              <Combobox
                options={[
                  { value: "all", label: "全部子项目" },
                  ...availableSubProjects.map((sub) => ({
                    value: sub.id,
                    label: sub.name,
                  })),
                ]}
                value={filters.subProject || "all"}
                onChange={(value) => handleFilterChange("subProject", value)}
                placeholder="选择子项目"
              />
            </div>
          )}

          {showFundType && (
            <div>
              <label className="text-sm font-medium">资金类型</label>
              <Combobox
                options={[
                  { value: "all", label: "全部类型" },
                  ...fundTypes.map((type) => ({
                    value: type.id,
                    label: type.name,
                  })),
                ]}
                value={filters.fundType || "all"}
                onChange={(value) => handleFilterChange("fundType", value)}
                placeholder="选择资金类型"
              />
            </div>
          )}

          {showStatus && (
            <div>
              <label className="text-sm font-medium">状态</label>
              <Combobox
                options={[
                  { value: "all", label: "全部状态" },
                  { value: "UNFILLED", label: "未填写" },
                  { value: "DRAFT", label: "草稿" },
                  { value: "SUBMITTED", label: "已提交" },
                  { value: "APPROVED", label: "已通过" },
                  { value: "REJECTED", label: "已拒绝" },
                  { value: "PENDING_WITHDRAWAL", label: "待撤回" },
                  { value: "WITHDRAWN", label: "已撤回" },
                ]}
                value={filters.status}
                onChange={(value) => handleFilterChange("status", value)}
                placeholder="选择状态"
              />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-2 mt-4">
          <Button variant="outline" onClick={onReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <Button onClick={onSearch} disabled={loading}>
            <Search className="h-4 w-4 mr-2" />
            {loading ? "搜索中..." : "搜索"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 