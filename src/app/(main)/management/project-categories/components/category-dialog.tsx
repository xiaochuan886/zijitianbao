"use client"

import { useState, useEffect } from "react"
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
import { Label } from "@/components/ui/label"
import { Save, Tag } from "lucide-react"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"

interface ProjectCategory {
  id: string
  name: string
  code?: string
  createdAt: Date
}

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: ProjectCategory | null
  onSubmit: (data: { name: string; code: string }) => Promise<void>
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  // 当对话框打开或分类数据变化时，更新表单
  useEffect(() => {
    if (open) {
      if (category) {
        setFormData({
          name: category.name,
          code: category.code || "",
        })
      } else {
        // 新建分类时的默认值
        setFormData({
          name: "",
          code: "",
        })
      }
      
      // 清除错误
      setErrors({})
    }
  }, [open, category])

  // 更新表单字段
  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    })
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ""
      })
    }
  }
  
  // 表单验证
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    let isValid = true
    
    // 验证分类名称
    if (!formData.name.trim()) {
      newErrors.name = "分类名称不能为空"
      isValid = false
    }
    
    setErrors(newErrors)
    return isValid
  }
  
  // 提交表单
  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error("表单验证失败，请检查输入")
      return
    }
    
    try {
      setIsSubmitting(true)
      await onSubmit(formData)
    } catch (error) {
      console.error("提交失败:", error)
      toast.error("提交失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            <DialogTitle>{category ? "编辑项目分类" : "新增项目分类"}</DialogTitle>
          </div>
          <DialogDescription>
            {category ? "修改项目分类信息" : "创建新的项目分类，用于对项目进行分组"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              分类名称 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="输入分类名称"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="code">分类编码</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => handleInputChange("code", e.target.value)}
              placeholder="输入分类编码（选填）"
            />
          </div>
        </div>
        
        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存分类
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 