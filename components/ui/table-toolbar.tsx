import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X, Download, Upload, AlertCircle } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TableToolbarProps {
  onSearch: (value: string) => void
  placeholder?: string
  searchWidth?: string
  templateUrl?: string
  onImport?: (file: File) => Promise<{ success: boolean; errors?: string[] }>
  importTitle?: string
  importDescription?: string
}

export function TableToolbar({ 
  onSearch, 
  placeholder = "搜索...",
  searchWidth = "w-[250px]",
  templateUrl,
  onImport,
  importTitle = "批量导入",
  importDescription = "请选择CSV文件进行批量导入",
}: TableToolbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentSearch = searchParams.get("search") || ""
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])
  const [showErrors, setShowErrors] = useState(false)

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      params.set(name, value)
      return params.toString()
    },
    [searchParams]
  )

  const handleSearch = (value: string) => {
    router.push(`${pathname}?${createQueryString("search", value)}`)
    onSearch(value)
  }

  const handleClear = () => {
    router.push(pathname)
    onSearch("")
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onImport) return

    try {
      setIsImporting(true)
      setProgress(0)
      setErrors([])

      // 模拟进度
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 500)

      const result = await onImport(file)
      
      clearInterval(progressInterval)
      setProgress(100)

      if (!result.success && result.errors) {
        setErrors(result.errors)
        setShowErrors(true)
      }
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "导入失败"])
      setShowErrors(true)
    } finally {
      setIsImporting(false)
      // 重置文件输入
      e.target.value = ""
    }
  }

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={placeholder}
              defaultValue={currentSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className={`pl-8 ${searchWidth}`}
            />
            {currentSearch && (
              <Button
                variant="ghost"
                className="absolute right-0 top-0 h-full px-2"
                onClick={handleClear}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {(templateUrl || onImport) && (
          <div className="flex items-center gap-2">
            {templateUrl && (
              <Button variant="outline" size="sm" asChild>
                <a href={templateUrl} download>
                  <Download className="h-4 w-4 mr-2" />
                  下载模板
                </a>
              </Button>
            )}
            {onImport && (
              <div className="relative">
                <Button variant="outline" size="sm" disabled={isImporting}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isImporting ? "导入中..." : "批量导入"}
                </Button>
                <Input
                  type="file"
                  accept=".csv"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleFileChange}
                  disabled={isImporting}
                />
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isImporting} onOpenChange={setIsImporting}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{importTitle}</DialogTitle>
            <DialogDescription>{importDescription}</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-muted-foreground mt-2 text-center">
              {progress}%
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showErrors} onOpenChange={setShowErrors}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>导入错误</DialogTitle>
            <DialogDescription>
              以下数据导入失败，请修正后重试
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            <div className="space-y-2 py-4">
              {errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>错误 {index + 1}</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setShowErrors(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 