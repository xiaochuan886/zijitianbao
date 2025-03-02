import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Save, Building, Building2 } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"

interface Organization {
  id: string
  name: string
  code: string
  departments: { id: string; name: string }[]
}

interface OrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization | null
  onSubmit: (data: { name: string; code: string }) => Promise<void>
}

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSubmit,
}: OrganizationDialogProps) {
  const [name, setName] = useState("")
  const [code, setCode] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [nameError, setNameError] = useState("")
  const [codeError, setCodeError] = useState("")

  // 当 organization 改变时更新表单数据
  useEffect(() => {
    if (organization) {
      setName(organization.name)
      setCode(organization.code)
    } else {
      setName("")
      setCode("")
    }
    // 重置错误状态
    setNameError("")
    setCodeError("")
  }, [organization, open])

  const validateForm = (): boolean => {
    let isValid = true

    if (!name.trim()) {
      setNameError("机构名称不能为空")
      isValid = false
    } else {
      setNameError("")
    }

    if (!code.trim()) {
      setCodeError("机构代码不能为空")
      isValid = false
    } else if (!/^[A-Za-z0-9_-]+$/.test(code.trim())) {
      setCodeError("机构代码只能包含字母、数字、下划线和连字符")
      isValid = false
    } else {
      setCodeError("")
    }

    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit({ name: name.trim(), code: code.trim() })
      onOpenChange(false)
    } catch (error) {
      console.error("提交失败:", error)
      toast.error("操作失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isSubmitting) {
          if (!isOpen) {
            setName("")
            setCode("")
            setNameError("")
            setCodeError("")
          }
          onOpenChange(isOpen)
        }
      }}
    >
      <DialogContent className="sm:max-w-[485px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <DialogTitle>
              {organization ? "编辑机构" : "新建机构"}
            </DialogTitle>
          </div>
          <DialogDescription>
            {organization
              ? "修改机构信息，更新将影响与该机构关联的所有部门和项目"
              : "创建一个新的机构，后续可以添加部门和关联项目"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              机构名称
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (e.target.value.trim()) setNameError("")
              }}
              placeholder="请输入机构名称"
              className={nameError ? "border-red-500" : ""}
            />
            {nameError && <p className="text-sm text-red-500">{nameError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-medium">
              机构代码
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                if (e.target.value.trim()) setCodeError("")
              }}
              placeholder="请输入机构代码，如 org-finance"
              className={codeError ? "border-red-500" : ""}
            />
            {codeError ? (
              <p className="text-sm text-red-500">{codeError}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                代码用于系统内部引用，建议使用简单英文字符
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  保存中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 