"use client"

import { useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { ProjectFilters, commonStatusOptions } from "@/hooks/use-funding-common"

interface FilterCardProps {
  title?: string
  filters: ProjectFilters
  organizations: { id: string; name: string; code?: string }[]
  departments: { id: string; name: string }[]
  categories: { id: string; name: string }[]
  onFilterChange: (key: keyof ProjectFilters, value: string) => void
  onReset: () => void
  onSearch: () => void
  loading: boolean
  debouncedFetch?: boolean
}

function FilterCardComponent({
  title = "筛选条件",
  filters,
  organizations,
  departments,
  categories,
  onFilterChange,
  onReset,
  onSearch,
  loading,
  debouncedFetch = false
}: FilterCardProps) {
  // 使用useCallback包装事件处理函数，避免不必要的重新创建
  const handleFilterChange = useCallback((key: keyof ProjectFilters, value: string) => {
    onFilterChange(key, value);
  }, [onFilterChange]);

  const handleReset = useCallback(() => {
    onReset();
  }, [onReset]);

  const handleSearch = useCallback(() => {
    onSearch();
  }, [onSearch]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">机构</label>
            <Select
              value={filters.organizationId || "all"}
              onValueChange={(value) => handleFilterChange("organizationId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择机构" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.code ? `${org.name} (${org.code})` : org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">部门</label>
            <Select
              value={filters.departmentId || "all"}
              onValueChange={(value) => handleFilterChange("departmentId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {departments.map((dep) => (
                  <SelectItem key={dep.id} value={dep.id}>
                    {dep.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">项目分类</label>
            <Select
              value={filters.categoryId || "all"}
              onValueChange={(value) => handleFilterChange("categoryId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择项目分类" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">项目名称</label>
            <Input
              type="text"
              value={filters.projectName || ""}
              onChange={(e) => handleFilterChange("projectName", e.target.value)}
              placeholder="输入项目名称"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">状态</label>
            <Select
              value={filters.status || "all"}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {commonStatusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button 
            variant="outline" 
            onClick={handleReset}
            disabled={loading || debouncedFetch}
          >
            重置
          </Button>
          <Button 
            className="ml-2"
            onClick={handleSearch}
            disabled={loading || debouncedFetch}
          >
            {loading ? "加载中..." : "查询"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

// 使用React.memo包装组件，避免不必要的重渲染
export const FilterCard = memo(FilterCardComponent); 