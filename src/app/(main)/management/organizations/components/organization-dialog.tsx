import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Organization } from "../columns"
import { OrganizationForm } from "./organization-form"

interface OrganizationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization?: Organization
  onSubmit: (data: { name: string; code: string }) => Promise<void>
}

export function OrganizationDialog({
  open,
  onOpenChange,
  organization,
  onSubmit,
}: OrganizationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {organization ? "编辑机构信息" : "新增机构"}
          </DialogTitle>
          <DialogDescription>
            {organization
              ? "修改机构的基本信息，保存后将立即生效。"
              : "添加新的机构信息，创建后可以进一步管理部门。"}
          </DialogDescription>
        </DialogHeader>
        <OrganizationForm
          initialData={organization}
          onSubmit={onSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  )
} 