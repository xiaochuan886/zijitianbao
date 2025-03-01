"use client"

import { Button } from "@/components/ui/button"
import { FileEdit, Upload } from "lucide-react"

interface ActionButtonsProps {
  selectedCount: number
  loading: boolean
  submitting: boolean
  canEdit: boolean
  canSubmit: boolean
  onEdit: () => void
  onSubmit: () => void
  showSubmitButton?: boolean
}

export function ActionButtons({
  selectedCount,
  loading,
  submitting,
  canEdit,
  canSubmit,
  onEdit,
  onSubmit,
  showSubmitButton = true
}: ActionButtonsProps) {
  return (
    <div className="flex justify-end gap-2 mt-4">
      <Button 
        variant="outline" 
        onClick={onEdit}
        disabled={
          selectedCount === 0 || 
          loading ||
          !canEdit
        }
      >
        <FileEdit className="mr-2 h-4 w-4" />
        批量填报
      </Button>
      {showSubmitButton && (
        <Button 
          onClick={onSubmit}
          disabled={
            selectedCount === 0 || 
            submitting || 
            loading ||
            !canSubmit
          }
        >
          <Upload className="mr-2 h-4 w-4" />
          {submitting ? "提交中..." : "批量提交"}
        </Button>
      )}
    </div>
  )
} 