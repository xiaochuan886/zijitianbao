import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

interface Department {
  id?: string
  name: string
  isNew?: boolean
  isDeleted?: boolean
}

interface DepartmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  departments: Department[]
  onSave: (departments: Department[]) => Promise<void>
}

export function DepartmentDialog({
  open,
  onOpenChange,
  organizationId,
  departments: initialDepartments,
  onSave,
}: DepartmentDialogProps) {
  const [departments, setDepartments] = useState<Department[]>(() =>
    initialDepartments.map(dept => ({ ...dept, isNew: false, isDeleted: false }))
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 添加新部门
  const handleAddDepartment = () => {
    setDepartments([
      ...departments,
      { name: "", isNew: true, isDeleted: false },
    ])
  }

  // 删除部门
  const handleDeleteDepartment = (index: number) => {
    setDepartments(
      departments.map((dept, i) =>
        i === index
          ? dept.isNew
            ? { ...dept, isDeleted: true }
            : { ...dept, isDeleted: !dept.isDeleted }
          : dept
      )
    )
  }

  // 更新部门名称
  const handleUpdateDepartment = (index: number, name: string) => {
    setDepartments(
      departments.map((dept, i) =>
        i === index ? { ...dept, name } : dept
      )
    )
  }

  // 保存所有更改
  const handleSave = async () => {
    try {
      setIsSubmitting(true)

      // 验证部门名称
      const invalidDepartments = departments.filter(
        dept => !dept.isDeleted && !dept.name.trim()
      )
      if (invalidDepartments.length > 0) {
        toast.error("部门名称不能为空")
        return
      }

      // 过滤掉标记为删除的新部门
      const validDepartments = departments.filter(
        dept => !(dept.isNew && dept.isDeleted)
      )

      await onSave(validDepartments)
      onOpenChange(false)
    } catch (error) {
      toast.error("保存失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>管理部门</DialogTitle>
          <DialogDescription>
            管理机构下的部门，支持批量添加和删除
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            {departments.map((dept, index) =>
              dept.isDeleted ? null : (
                <div
                  key={dept.id || index}
                  className="flex items-center space-x-2"
                >
                  <Input
                    value={dept.name}
                    onChange={(e) => handleUpdateDepartment(index, e.target.value)}
                    placeholder="请输入部门名称"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDepartment(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
          </div>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleAddDepartment}
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加部门
            </Button>
            <div className="space-x-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? "保存中..." : "保存更改"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 