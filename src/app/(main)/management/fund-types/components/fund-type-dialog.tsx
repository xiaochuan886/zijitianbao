import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FundType } from "./columns"
import { Spinner } from "@/components/ui/spinner"

interface FundTypeDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fundType?: FundType | null
  onSubmit: (data: { name: string }) => Promise<void>
}

export function FundTypeDialog({
  open,
  onOpenChange,
  fundType,
  onSubmit,
}: FundTypeDialogProps) {
  const [name, setName] = useState(fundType?.name || "")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // 重置表单
  const resetForm = () => {
    setName(fundType?.name || "")
    setError("")
  }

  // 处理对话框关闭
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      resetForm()
    }
    onOpenChange(open)
  }

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 表单验证
    if (!name.trim()) {
      setError("资金需求类型名称不能为空")
      return
    }
    
    try {
      setIsSubmitting(true)
      setError("")
      await onSubmit({ name: name.trim() })
      handleOpenChange(false)
    } catch (err: any) {
      setError(err.message || "提交失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {fundType ? "编辑资金需求类型" : "新增资金需求类型"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">类型名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入资金需求类型名称"
                disabled={isSubmitting}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
              {fundType ? "更新" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 