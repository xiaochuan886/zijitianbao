import { useState } from "react"
const dateFns = require('date-fns')
const { zhCN: zhLocale } = require('date-fns/locale')
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Download } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

export interface AuditLog {
  id: string
  userId: string
  userName: string
  action: string
  resource: string
  resourceId?: string
  details?: Record<string, any>
  status: "success" | "failure"
  error?: string
  createdAt: string
}

interface AuditLogTimelineProps {
  logs: AuditLog[]
  onExport?: () => void
  onFilterChange?: (action: string) => void
  actions: { value: string; label: string }[]
}

function getStatusColor(status: AuditLog["status"]) {
  return status === "success" ? "bg-green-500" : "bg-red-500"
}

function getActionColor(action: string) {
  const colors: Record<string, string> = {
    create: "bg-blue-500",
    update: "bg-yellow-500",
    delete: "bg-red-500",
    import: "bg-purple-500",
    export: "bg-indigo-500",
  }
  return colors[action.toLowerCase()] || "bg-gray-500"
}

export function AuditLogTimeline({
  logs,
  onExport,
  onFilterChange,
  actions,
}: AuditLogTimelineProps) {
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Select onValueChange={onFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="选择操作类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">全部操作</SelectItem>
            {actions.map(action => (
              <SelectItem key={action.value} value={action.value}>
                {action.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {onExport && (
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            导出日志
          </Button>
        )}
      </div>

      <ScrollArea className="h-[500px] pr-4">
        <div className="space-y-4">
          {logs.map((log) => (
            <div
              key={log.id}
              className="flex gap-4 relative pb-8 last:pb-0"
              onClick={() => setSelectedLog(log)}
            >
              <div className="absolute left-[19px] top-[28px] bottom-0 w-[2px] bg-border last:hidden" />
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${getActionColor(
                  log.action
                )}`}
              >
                <span className="text-white text-sm">
                  {log.action.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{log.userName}</p>
                  <time className="text-sm text-muted-foreground">
                    {dateFns.format(new Date(log.createdAt), "PPpp", { locale: zhLocale })}
                  </time>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm">
                    {log.action} {log.resource}
                    {log.resourceId ? ` (${log.resourceId})` : ""}
                  </p>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium text-white ${getStatusColor(
                      log.status
                    )}`}
                  >
                    {log.status === "success" ? "成功" : "失败"}
                  </span>
                </div>
                {log.error && (
                  <p className="text-sm text-red-500">{log.error}</p>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  查看详情
                </Button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>操作详情</DialogTitle>
            <DialogDescription>
              {selectedLog?.action} {selectedLog?.resource}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">操作人</p>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.userName}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">操作时间</p>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.createdAt &&
                    dateFns.format(new Date(selectedLog.createdAt), "PPpp", {
                      locale: zhLocale,
                    })}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">操作类型</p>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.action}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">操作状态</p>
                <p className="text-sm text-muted-foreground">
                  {selectedLog?.status === "success" ? "成功" : "失败"}
                </p>
              </div>
            </div>
            {selectedLog?.details && (
              <div>
                <p className="text-sm font-medium">详细信息</p>
                <pre className="mt-2 whitespace-pre-wrap text-sm">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
            {selectedLog?.error && (
              <div>
                <p className="text-sm font-medium text-red-500">错误信息</p>
                <p className="text-sm text-red-500">{selectedLog.error}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 