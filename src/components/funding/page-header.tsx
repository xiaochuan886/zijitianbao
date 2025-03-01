"use client"

import { Button } from "@/components/ui/button"
import { RotateCcw } from "lucide-react"

interface PageHeaderProps {
  title: string
  loading: boolean
  onRefresh: () => void
}

export function PageHeader({
  title,
  loading,
  onRefresh
}: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      <Button 
        variant="outline" 
        onClick={onRefresh}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="animate-spin mr-2">⟳</span>
            加载中...
          </>
        ) : (
          <>
            <RotateCcw className="mr-2 h-4 w-4" />
            刷新
          </>
        )}
      </Button>
    </div>
  )
} 