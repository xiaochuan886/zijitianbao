"use client"

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
  organizations: { value: string, label: string }[]
  departments: { value: string, label: string }[]
  onFilterChange: (filters: ProjectFilters) => void
  onReset: () => void
  onSearch: () => void
  loading: boolean
  debouncedFetch: boolean
}

export function FilterCard({
  title = "筛选条件",
  filters,
  organizations,
  departments,
  onFilterChange,
  onReset,
  onSearch,
  loading,
  debouncedFetch
}: FilterCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">机构</label>
            <Select
              value={filters.organization}
              onValueChange={(value) => onFilterChange({...filters, organization: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择机构" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {organizations.map((org) => (
                  <SelectItem key={org.value} value={org.value}>
                    {org.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">部门</label>
            <Select
              value={filters.department}
              onValueChange={(value) => onFilterChange({...filters, department: value})}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择部门" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                {departments.map((dep) => (
                  <SelectItem key={dep.value} value={dep.value}>
                    {dep.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">项目名称</label>
            <Input
              type="text"
              value={filters.project}
              onChange={(e) => onFilterChange({...filters, project: e.target.value})}
              placeholder="输入项目名称"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">状态</label>
            <Select
              value={filters.status}
              onValueChange={(value) => onFilterChange({...filters, status: value})}
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
            onClick={onReset}
            disabled={loading || debouncedFetch}
          >
            重置
          </Button>
          <Button 
            className="ml-2"
            onClick={onSearch}
            disabled={loading || debouncedFetch}
          >
            {(loading || debouncedFetch) ? "加载中..." : "查询"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 