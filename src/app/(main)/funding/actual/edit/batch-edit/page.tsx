"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import { Checkbox } from "@/components/ui/checkbox"
import { fetchActualPaymentMetadata, saveActualPaymentDrafts, submitActualPayments } from "../../client-api"

// 定义类型
interface Organization {
  id: string;
  name: string;
  code?: string;
}

interface Department {
  id: string;
  name: string;
  organizationId: string;
}

interface AvailableMonth {
  value: string;
  label: string;
}

interface Metadata {
  organizations: Organization[];
  departments: Department[];
  availableMonths: AvailableMonth[];
}

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
}

interface ApiResponse {
  success: boolean;
  data?: {
    count?: number;
    message?: string;
  };
  error?: {
    message?: string;
  };
}

// 表单验证模式
const formSchema = z.object({
  year: z.string().min(4, "年份必须是有效的四位数字"),
  month: z.string().min(1, "请选择月份"),
  organizationId: z.string().optional(),
  departmentId: z.string().optional(),
  isUserReport: z.boolean().default(true),
  remarks: z.string().optional(),
});

export default function BatchEditActualPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [metadata, setMetadata] = useState<Metadata>({
    organizations: [],
    departments: [],
    availableMonths: []
  });
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState("user"); // "user" 或 "finance"

  // 初始化表单
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      year: new Date().getFullYear().toString(),
      month: (new Date().getMonth() + 1).toString(),
      organizationId: "",
      departmentId: "",
      isUserReport: true,
      remarks: "",
    },
  });

  // 监听表单值变化
  const watchOrganizationId = form.watch("organizationId");
  const watchIsUserReport = form.watch("isUserReport");

  // 获取元数据
  useEffect(() => {
    const getMetadata = async () => {
      try {
        const result = await fetchActualPaymentMetadata();
        if (result.success) {
          setMetadata(result.data as Metadata);
        } else {
          toast.error("获取元数据失败");
        }
      } catch (error) {
        console.error("获取元数据失败:", error);
        toast.error("获取元数据失败");
      }
    };

    getMetadata();
  }, []);

  // 根据选择的组织过滤部门
  useEffect(() => {
    if (watchOrganizationId) {
      const filtered = metadata.departments.filter(
        (dept) => dept.organizationId === watchOrganizationId
      );
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments([]);
    }
  }, [watchOrganizationId, metadata.departments]);

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
    if (selectedProjects.length === 0) {
      toast.error("请至少选择一个项目");
      return;
    }

    try {
      setSubmitting(true);
      const projectIds = selectedProjects.map(p => p.id);
      
      // 调用API提交数据
      const result = await submitActualPayments(
        projectIds.map(id => ({ id })),
        values.remarks || "",
        values.isUserReport
      );
      
      if (result.success) {
        toast.success(`已成功提交 ${result.data?.count || projectIds.length} 条记录`);
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
    if (selectedProjects.length === 0) {
      toast.error("请至少选择一个项目");
      return;
    }

    try {
      setSaving(true);
      const values = form.getValues();
      const projectIds = selectedProjects.map(p => p.id);
      
      // 调用API保存草稿
      const result = await saveActualPaymentDrafts(
        projectIds.map(id => ({ id })),
        values.remarks || "",
        values.isUserReport
      );
      
      if (result.success) {
        toast.success(`已成功保存 ${result.data?.count || projectIds.length} 条记录`);
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

  // 加载项目列表
  const loadProjects = async () => {
    const values = form.getValues();
    if (!values.year || !values.month) {
      toast.error("请选择年份和月份");
      return;
    }

    try {
      setLoading(true);
      // 构建查询参数
      const params = new URLSearchParams();
      params.set("year", values.year);
      params.set("month", values.month);
      if (values.organizationId) params.set("organizationId", values.organizationId);
      if (values.departmentId) params.set("departmentId", values.departmentId);
      params.set("isUserReport", values.isUserReport.toString());

      // 获取项目列表
      const response = await fetch(`/api/funding/actual?${params.toString()}`);
      const data = await response.json();
      
      if (response.ok) {
        setProjects(data.projects || []);
        setSelectedProjects([]);
      } else {
        toast.error(data.error || "获取项目列表失败");
      }
    } catch (error) {
      console.error("获取项目列表失败:", error);
      toast.error("获取项目列表失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理项目选择
  const toggleProjectSelection = (project: Project) => {
    setSelectedProjects(prev => {
      const isSelected = prev.some(p => p.id === project.id);
      if (isSelected) {
        return prev.filter(p => p.id !== project.id);
      } else {
        return [...prev, project];
      }
    });
  };

  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects([...projects]);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">批量编辑实际支付</h1>
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
        <TabsList className="grid w-[400px] grid-cols-2">
          <TabsTrigger value="user">用户报表</TabsTrigger>
          <TabsTrigger value="finance">财务报表</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>筛选条件</CardTitle>
            <CardDescription>
              选择年份、月份和组织部门来筛选项目
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FormField
                    control={form.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>年份</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择年份" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {[...Array(5)].map((_, i) => {
                              const year = new Date().getFullYear() - 2 + i;
                              return (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}年
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>月份</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择月份" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {metadata.availableMonths.map((month) => (
                              <SelectItem key={month.value} value={month.value.toString()}>
                                {month.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="organizationId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>组织</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择组织" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">全部组织</SelectItem>
                            {metadata.organizations.map((org) => (
                              <SelectItem key={org.id} value={org.id}>
                                {org.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="departmentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>部门</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          disabled={!watchOrganizationId}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={watchOrganizationId ? "选择部门" : "请先选择组织"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="">全部部门</SelectItem>
                            {filteredDepartments.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id}>
                                {dept.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
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
                        可选，添加关于此次批量操作的备注信息
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
                    onClick={loadProjects}
                    disabled={loading}
                  >
                    {loading ? "加载中..." : "查询项目"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {projects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>项目列表</CardTitle>
              <CardDescription>
                选择需要批量操作的项目
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  共 {projects.length} 个项目，已选择 {selectedProjects.length} 个
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleSelectAll}
                >
                  {selectedProjects.length === projects.length ? "取消全选" : "全选"}
                </Button>
              </div>
              
              <div className="border rounded-md">
                <div className="grid grid-cols-12 gap-2 p-3 font-medium bg-muted">
                  <div className="col-span-1">选择</div>
                  <div className="col-span-3">项目名称</div>
                  <div className="col-span-2">组织</div>
                  <div className="col-span-2">部门</div>
                  <div className="col-span-2">预算金额</div>
                  <div className="col-span-2">状态</div>
                </div>
                
                <div className="divide-y">
                  {projects.map((project) => {
                    const isSelected = selectedProjects.some(p => p.id === project.id);
                    return (
                      <div
                        key={project.id}
                        className={`grid grid-cols-12 gap-2 p-3 hover:bg-muted/50 cursor-pointer ${
                          isSelected ? "bg-muted/30" : ""
                        }`}
                        onClick={() => toggleProjectSelection(project)}
                      >
                        <div className="col-span-1">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleProjectSelection(project)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="col-span-3 truncate">{project.name}</div>
                        <div className="col-span-2 truncate">{project.organization?.name}</div>
                        <div className="col-span-2 truncate">{project.department?.name}</div>
                        <div className="col-span-2">
                          {new Intl.NumberFormat("zh-CN", {
                            style: "currency",
                            currency: "CNY",
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          }).format(project.budget || 0)}
                        </div>
                        <div className="col-span-2">
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
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/funding/actual")}
              >
                返回
              </Button>
              <div className="space-x-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={saveDraft}
                  disabled={saving || selectedProjects.length === 0}
                >
                  {saving ? "保存中..." : "保存草稿"}
                </Button>
                <Button
                  type="button"
                  onClick={form.handleSubmit(onSubmit)}
                  disabled={submitting || selectedProjects.length === 0}
                >
                  {submitting ? "提交中..." : "提交"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        )}
      </div>
    </div>
  );
} 