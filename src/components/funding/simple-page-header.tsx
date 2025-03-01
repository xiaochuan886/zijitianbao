import { RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface SimplePageHeaderProps {
  title: string
  loading?: boolean
  onRefresh?: () => void
}

export function SimplePageHeader({ title, loading = false, onRefresh }: SimplePageHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      {onRefresh && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          {loading ? "刷新中..." : "刷新"}
        </Button>
      )}
    </div>
  )
}
