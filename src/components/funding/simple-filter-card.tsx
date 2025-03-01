import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, Search, RotateCcw } from "lucide-react"

interface ProjectFilters {
  organization: string
  department: string
  project: string
  status: string
}

interface Organization {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

interface SimpleFilterCardProps {
  filters: ProjectFilters
  organizations: Organization[]
  departments: Department[]
  onFilterChange: (filters: Partial<ProjectFilters>) => void
  onReset: () => void
  onSearch: () => void
  loading?: boolean
  debouncedFetch?: (immediate?: boolean) => void
}

export function SimpleFilterCard({
  filters,
  organizations,
  departments,
  onFilterChange,
  onReset,
  onSearch,
  loading = false,
}: SimpleFilterCardProps) {
  const [localFilters, setLocalFilters] = useState<ProjectFilters>(filters)

  // 当外部filters变化时，更新本地状态
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // 处理本地筛选条件变化
  const handleLocalFilterChange = (key: keyof ProjectFilters, value: string) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }))
  }

  // 应用筛选条件
  const applyFilters = () => {
    onFilterChange(localFilters)
    onSearch()
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="organization">机构</Label>
            <Select
              value={localFilters.organization}
              onValueChange={(value) => handleLocalFilterChange("organization", value)}
              disabled={loading}
            >
              <SelectTrigger id="organization">
                <SelectValue placeholder="选择机构" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部机构</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="department">部门</Label>
            <Select
              value={localFilters.department}
              onValueChange={(value) => handleLocalFilterChange("department", value)}
              disabled={loading}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部部门</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">项目名称</Label>
            <Input
              id="project"
              placeholder="输入项目名称"
              value={localFilters.project}
              onChange={(e) => handleLocalFilterChange("project", e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select
              value={localFilters.status}
              onValueChange={(value) => handleLocalFilterChange("status", value)}
              disabled={loading}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="DRAFT">草稿</SelectItem>
                <SelectItem value="UNFILLED">未填写</SelectItem>
                <SelectItem value="SUBMITTED">已提交</SelectItem>
                <SelectItem value="PENDING_WITHDRAWAL">待撤回</SelectItem>
                <SelectItem value="APPROVED">已批准</SelectItem>
                <SelectItem value="REJECTED">已拒绝</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end mt-4 space-x-2">
          <Button
            variant="outline"
            onClick={onReset}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置
          </Button>
          <Button
            onClick={applyFilters}
            disabled={loading}
          >
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 