"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { saveActualPaymentDrafts, submitActualPayments } from "../../client-api"

// 定义类型
interface Project {
  id: string;
  name: string;
  organization?: {
    name: string;
  };
  department?: {
    name: string;
  };
  budget?: number;
  status?: string;
  actualUser?: number | null;
  actualFinance?: number | null;
  year: number;
  month: number;
}

// 表单验证模式
const formSchema = z.object({
  actualUser: z.coerce.number().min(0, "金额不能为负数").optional().nullable(),
  actualFinance: z.coerce.number().min(0, "金额不能为负数").optional().nullable(),
  isUserReport: z.boolean().default(true),
  remarks: z.string().optional(),
});

export default function EditActualPaymentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [activeTab, setActiveTab] = useState("user"); // "user" 或 "finance"

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      actualUser: null,
      actualFinance: null,
      isUserReport: true,
      remarks: "",
    },
  });

  // 监听表单值变化
  const watchIsUserReport = form.watch("isUserReport");

  // 获取项目数据
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/funding/actual/${id}`);
        const data = await response.json();
        
        if (response.ok) {
          setProject(data.project);
          // 设置表单默认值
          form.reset({
            actualUser: data.project.actualUser,
            actualFinance: data.project.actualFinance,
            isUserReport: true,
            remarks: "",
          });
        } else {
          toast.error(data.error || "获取项目数据失败");
          router.push("/funding/actual");
        }
      } catch (error) {
        console.error("获取项目数据失败:", error);
        toast.error("获取项目数据失败");
        router.push("/funding/actual");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProject();
    }
  }, [id, router, form]);

  // 监听用户/财务报表切换
  useEffect(() => {
    setActiveTab(watchIsUserReport ? "user" : "finance");
  }, [watchIsUserReport]);

  // 处理标签页切换
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    form.setValue("isUserReport", value === "user");
  };

  // 处理表单提交
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!project) return;

    try {
      setSubmitting(true);
      
      // 根据当前选择的报表类型设置实际金额
      const recordData = {
        id: project.id,
        ...(values.isUserReport 
          ? { actualUser: values.actualUser } 
          : { actualFinance: values.actualFinance })
      };
      
      // 调用API提交数据
      const result = await submitActualPayments(
        [recordData],
        values.remarks || "",
        values.isUserReport
      );
      
      if (result.success) {
        toast.success("已成功提交记录");
        // 提交成功后返回列表页
        setTimeout(() => {
          router.push("/funding/actual");
        }, 1500);
      } else {
        toast.error(result.error?.message || "提交失败");
      }
    } catch (error) {
      console.error("提交失败:", error);
      toast.error("提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  // 保存草稿
  const saveDraft = async () => {
    if (!project) return;

    try {
      setSaving(true);
      const values = form.getValues();
      
      // 根据当前选择的报表类型设置实际金额
      const recordData = {
        id: project.id,
        ...(values.isUserReport 
          ? { actualUser: values.actualUser } 
          : { actualFinance: values.actualFinance })
      };
      
      // 调用API保存草稿
      const result = await saveActualPaymentDrafts(
        [recordData],
        values.remarks || "",
        values.isUserReport
      );
      
      if (result.success) {
        toast.success("已成功保存记录");
      } else {
        toast.error(result.error?.message || "保存失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast.error("保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p>加载中...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center h-40">
              <p>未找到项目数据</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">编辑实际支付</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="user">用户报表</TabsTrigger>
          <TabsTrigger value="finance">财务报表</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>项目信息</CardTitle>
            <CardDescription>
              查看项目基本信息
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">项目名称</p>
                <p className="text-lg">{project.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">预算金额</p>
                <p className="text-lg">
                  {new Intl.NumberFormat("zh-CN", {
                    style: "currency",
                    currency: "CNY",
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(project.budget || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">组织</p>
                <p className="text-lg">{project.organization?.name || "未指定"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">部门</p>
                <p className="text-lg">{project.department?.name || "未指定"}</p>
              </div>
              <div>
                <p className="text-sm font-medium">年份</p>
                <p className="text-lg">{project.year}年</p>
              </div>
              <div>
                <p className="text-sm font-medium">月份</p>
                <p className="text-lg">{project.month}月</p>
              </div>
              <div>
                <p className="text-sm font-medium">状态</p>
                <p className="text-lg">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    project.status === "draft" ? "bg-yellow-100 text-yellow-800" :
                    project.status === "submitted" ? "bg-blue-100 text-blue-800" :
                    project.status === "approved" ? "bg-green-100 text-green-800" :
                    "bg-gray-100 text-gray-800"
                  }`}>
                    {project.status === "draft" ? "草稿" :
                     project.status === "submitted" ? "已提交" :
                     project.status === "approved" ? "已批准" :
                     project.status === "rejected" ? "已拒绝" :
                     project.status === "pending_withdrawal" ? "待撤回" :
                     project.status}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>实际支付金额</CardTitle>
            <CardDescription>
              {activeTab === "user" ? "编辑用户报表实际支付金额" : "编辑财务报表实际支付金额"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {activeTab === "user" ? (
                  <FormField
                    control={form.control}
                    name="actualUser"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>用户报表实际支付金额</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="输入实际支付金额"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          请输入用户报表的实际支付金额
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <FormField
                    control={form.control}
                    name="actualFinance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>财务报表实际支付金额</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="输入实际支付金额"
                            {...field}
                            value={field.value === null ? "" : field.value}
                            onChange={(e) => {
                              const value = e.target.value === "" ? null : parseFloat(e.target.value);
                              field.onChange(value);
                            }}
                          />
                        </FormControl>
                        <FormDescription>
                          请输入财务报表的实际支付金额
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>备注</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="输入备注信息"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        可选，添加关于此次操作的备注信息
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="flex justify-end space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/funding/actual")}
                  >
                    取消
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={saveDraft}
                    disabled={saving}
                  >
                    {saving ? "保存中..." : "保存草稿"}
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "提交中..." : "提交"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 