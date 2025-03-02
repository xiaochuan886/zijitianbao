import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Save, Building2, Users } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"

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
  const [departments, setDepartments] = useState<Department[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<{ [key: number]: string }>({})

  // 当弹窗打开或初始部门列表改变时，更新部门列表
  useEffect(() => {
    if (open) {
      setDepartments(
        initialDepartments.map(dept => ({
          ...dept,
          isNew: false,
          isDeleted: false
        }))
      )
      setErrors({})
    }
  }, [open, initialDepartments])

  // 添加新部门
  const handleAddDepartment = () => {
    setDepartments([
      ...departments,
      { name: "", isNew: true, isDeleted: false },
    ])
  }

  // 删除部门
  const handleDeleteDepartment = (index: number) => {
    const updatedDepts = [...departments]
    const dept = updatedDepts[index]
    
    if (dept.isNew) {
      // 如果是新添加的，直接从列表中移除
      updatedDepts.splice(index, 1)
    } else {
      // 如果是已有的，标记为删除
      updatedDepts[index] = { ...dept, isDeleted: !dept.isDeleted }
    }
    
    setDepartments(updatedDepts)
    
    // 清除该部门的错误
    if (errors[index]) {
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  // 恢复删除的部门
  const handleRestoreDepartment = (index: number) => {
    setDepartments(
      departments.map((dept, i) =>
        i === index ? { ...dept, isDeleted: false } : dept
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
    
    // 如果名称不为空，清除错误
    if (name.trim() && errors[index]) {
      const newErrors = { ...errors }
      delete newErrors[index]
      setErrors(newErrors)
    }
  }

  // 验证部门名称
  const validateDepartments = (): boolean => {
    const newErrors: { [key: number]: string } = {}
    let isValid = true
    
    departments.forEach((dept, index) => {
      if (!dept.isDeleted && !dept.name.trim()) {
        newErrors[index] = "部门名称不能为空"
        isValid = false
      }
    })
    
    setErrors(newErrors)
    return isValid
  }

  // 保存所有更改
  const handleSave = async () => {
    try {
      // 验证部门名称
      if (!validateDepartments()) {
        return
      }

      setIsSubmitting(true)

      // 过滤掉标记为删除的新部门
      const validDepartments = departments.filter(
        dept => !(dept.isNew && dept.isDeleted)
      )

      await onSave(validDepartments)
      onOpenChange(false)
      toast.success("部门信息已更新")
    } catch (error) {
      console.error("保存部门信息失败:", error)
      toast.error("保存失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 当前有效部门数量
  const activeDepartmentCount = departments.filter(d => !d.isDeleted).length
  // 当前删除的部门数量
  const deletedDepartmentCount = departments.filter(d => d.isDeleted && !d.isNew).length

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <DialogTitle>管理部门</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <div>管理机构下的部门，支持批量添加和删除</div>
            <div className="flex gap-2 mt-1">
              <Badge variant="outline">{activeDepartmentCount} 个部门</Badge>
              {deletedDepartmentCount > 0 && (
                <Badge variant="destructive">{deletedDepartmentCount} 个待删除</Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {departments.map((dept, index) => (
                <div key={dept.id || `new-${index}`}>
                  {dept.isDeleted ? (
                    <Card className="p-3 flex items-center justify-between bg-muted/50 border-dashed">
                      <div className="flex items-center">
                        <Trash2 className="h-4 w-4 text-muted-foreground mr-2" />
                        <span className="line-through text-muted-foreground">{dept.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRestoreDepartment(index)}
                      >
                        恢复
                      </Button>
                    </Card>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="relative flex-1">
                        <Input
                          value={dept.name}
                          onChange={(e) => handleUpdateDepartment(index, e.target.value)}
                          placeholder="请输入部门名称"
                          className={errors[index] ? "border-red-500 pr-8" : "pr-8"}
                        />
                        <Users className="h-4 w-4 text-muted-foreground absolute right-2.5 top-1/2 transform -translate-y-1/2" />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDepartment(index)}
                        className="text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {errors[index] && (
                        <div className="absolute text-red-500 text-xs mt-1">
                          {errors[index]}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-between pt-2">
            <Button
              variant="outline"
              onClick={handleAddDepartment}
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              添加部门
            </Button>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    保存更改
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 