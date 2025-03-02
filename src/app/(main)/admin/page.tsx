import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { FileIcon, SparkleIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

const AdminPage = () => {
  const router = useRouter()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            记录管理
          </CardTitle>
          <FileIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">
            管理系统中的记录骨架和状态
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="justify-start"
              onClick={() => router.push("/admin/generate-records")}
            >
              <SparkleIcon className="mr-2 h-4 w-4" />
              生成记录骨架
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AdminPage 