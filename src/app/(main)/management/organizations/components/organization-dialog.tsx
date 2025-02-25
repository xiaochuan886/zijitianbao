import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Save } from "lucide-react"

interface Organization {
  id: string
  name: string
  code: string
  departments: { id: string; name: string }[]
  createdAt: string
  updatedAt: string
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
  const [name, setName] = useState(organization?.name || "")
  const [code, setCode] = useState(organization?.code || "")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !code.trim()) return

    try {
      setIsSubmitting(true)
      await onSubmit({ name: name.trim(), code: code.trim() })
      setName("")
      setCode("")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          setName("")
          setCode("")
        }
        onOpenChange(open)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {organization ? "编辑机构" : "新建机构"}
          </DialogTitle>
          <DialogDescription>
            {organization
              ? "修改机构信息"
              : "创建一个新的机构，并填写相关信息"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              机构名称
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入机构名称"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="code" className="text-sm font-medium">
              机构代码
            </label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="请输入机构代码"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 