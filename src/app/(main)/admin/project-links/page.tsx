"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Loader2, ArrowRightIcon, RefreshCw, DatabaseIcon } from "lucide-react"
import { useSession } from "next-auth/react"
import { Role } from "@/lib/enums"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

export default function ProjectLinksPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedTab, setSelectedTab] = useState<string>("org")
  const [forceUpdate, setForceUpdate] = useState(false)
  const [result, setResult] = useState<any>(null)

  // 检查用户是否有管理员权限
  const isAdmin = session?.user?.role === Role.ADMIN

  if (!isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>无权访问</AlertTitle>
          <AlertDescription>
            只有管理员可以访问此页面。请联系系统管理员获取权限。
          </AlertDescription>
        </Alert>
        <div className="mt-4">
          <Button onClick={() => router.push("/")}>返回首页</Button>
        </div>
      </div>
    )
  }

  // 处理组织关联
  const handleCreateOrgLinks = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch("/api/admin/create-project-org-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forceUpdate,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`处理失败: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      setResult(data)
      
      toast({
        title: "操作成功",
        description: `成功创建 ${data.created} 个新关联，更新 ${data.updated} 个现有关联`,
      })
    } catch (error) {
      console.error("创建组织关联失败:", error)
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  // 处理部门关联
  const handleCreateDeptLinks = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch("/api/admin/create-project-dept-links", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          forceUpdate,
        }),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`处理失败: ${response.status} ${errorText}`)
      }
      
      const data = await response.json()
      setResult(data)
      
      toast({
        title: "操作成功",
        description: `成功创建 ${data.created} 个新关联，更新 ${data.updated} 个现有关联`,
      })
    } catch (error) {
      console.error("创建部门关联失败:", error)
      toast({
        title: "操作失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">项目关联管理</h1>
      
      <Alert className="mb-6">
        <DatabaseIcon className="h-4 w-4" />
        <AlertTitle>重要提示</AlertTitle>
        <AlertDescription>
          此工具用于修复项目与组织/部门之间的关联关系。执行此操作将影响数据库中的关联数据，请谨慎操作。
        </AlertDescription>
      </Alert>
      
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="org">项目-组织关联</TabsTrigger>
          <TabsTrigger value="dept">项目-部门关联</TabsTrigger>
        </TabsList>
        
        <TabsContent value="org">
          <Card>
            <CardHeader>
              <CardTitle>创建项目-组织关联</CardTitle>
              <CardDescription>
                为没有组织关联的项目创建关联关系，基于项目代码和组织代码进行智能匹配
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="force-update-org" 
                    checked={forceUpdate} 
                    onCheckedChange={(checked) => setForceUpdate(!!checked)}
                  />
                  <Label htmlFor="force-update-org">
                    强制更新已有关联（谨慎使用）
                  </Label>
                </div>
                
                <div className="text-sm text-muted-foreground mt-2">
                  <p>智能匹配规则：</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>如果项目代码前缀与组织代码匹配，则建立关联</li>
                    <li>如果没有匹配项，使用第一个组织作为默认值</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateOrgLinks} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "处理中..." : "创建项目-组织关联"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="dept">
          <Card>
            <CardHeader>
              <CardTitle>创建项目-部门关联</CardTitle>
              <CardDescription>
                为没有部门关联的项目创建关联关系，基于项目名称和部门名称进行智能匹配
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="force-update-dept" 
                    checked={forceUpdate} 
                    onCheckedChange={(checked) => setForceUpdate(!!checked)}
                  />
                  <Label htmlFor="force-update-dept">
                    强制更新已有关联（谨慎使用）
                  </Label>
                </div>
                
                <div className="text-sm text-muted-foreground mt-2">
                  <p>智能匹配规则：</p>
                  <ul className="list-disc list-inside mt-1">
                    <li>如果项目名称包含部门名称，则建立关联</li>
                    <li>如果没有匹配项，使用第一个部门作为默认值</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateDeptLinks} 
                disabled={loading}
                className="w-full"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? "处理中..." : "创建项目-部门关联"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
      
      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">操作结果</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">创建的关联数量</p>
                  <p className="text-3xl font-bold">{result.created}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">更新的关联数量</p>
                  <p className="text-3xl font-bold">{result.updated}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">跳过的项目数量</p>
                  <p className="text-2xl font-semibold">{result.skipped}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">总项目数量</p>
                  <p className="text-2xl font-semibold">{result.totalProjects}</p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => router.refresh()}
                  className="w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  刷新页面
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
} 