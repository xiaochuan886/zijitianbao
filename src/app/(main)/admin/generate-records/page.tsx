"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useOrganizations } from "@/hooks/use-organizations";
import { useDepartments } from "@/hooks/use-departments";

export default function GenerateRecordsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { organizations, isLoading: isLoadingOrgs } = useOrganizations();
  const { departments, isLoading: isLoadingDepts } = useDepartments();
  
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [month, setMonth] = useState<number>(new Date().getMonth() + 1);
  const [recordType, setRecordType] = useState<"predict" | "actual">("predict");
  const [organizationId, setOrganizationId] = useState<string>("");
  const [departmentId, setDepartmentId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  // 生成年份选项，从当前年份-5年到当前年份+5年
  const yearOptions = Array.from(
    { length: 11 },
    (_, i) => new Date().getFullYear() - 5 + i
  );
  
  // 生成月份选项
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setResult(null);
      
      const response = await fetch("/api/admin/generate-records", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          year,
          month,
          recordType,
          organizationId: organizationId || undefined,
          departmentId: departmentId || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "生成记录失败");
      }
      
      setResult(data.result);
      
      toast({
        title: "操作成功",
        description: data.message,
      });
    } catch (error) {
      console.error("生成记录出错:", error);
      toast({
        title: "操作失败",
        description: (error as Error).message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="container mx-auto py-10 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">生成填报记录骨架</h1>
        <Button onClick={() => router.push("/admin")} variant="outline">
          返回管理面板
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>记录生成配置</CardTitle>
          <CardDescription>
            系统将基于DetailedFundNeed配置为选定的年月生成记录骨架
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 记录类型选择 */}
            <div className="space-y-2">
              <Label>记录类型</Label>
              <RadioGroup
                value={recordType}
                onValueChange={(value) => setRecordType(value as "predict" | "actual")}
                className="flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="predict" id="predict" />
                  <Label htmlFor="predict">预测记录</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="actual" id="actual" />
                  <Label htmlFor="actual">实际支出记录</Label>
                </div>
              </RadioGroup>
            </div>
            
            {/* 组织选择 */}
            <div className="space-y-2">
              <Label>组织筛选（可选）</Label>
              <Select
                value={organizationId}
                onValueChange={setOrganizationId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="所有组织" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有组织</SelectItem>
                  {organizations?.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 部门选择 */}
            <div className="space-y-2">
              <Label>部门筛选（可选）</Label>
              <Select
                value={departmentId}
                onValueChange={setDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="所有部门" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">所有部门</SelectItem>
                  {departments?.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 年份选择 */}
            <div className="space-y-2">
              <Label>年份</Label>
              <Select
                value={year.toString()}
                onValueChange={(value) => setYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择年份" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}年
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* 月份选择 */}
            <div className="space-y-2">
              <Label>月份</Label>
              <Select
                value={month.toString()}
                onValueChange={(value) => setMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择月份" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={m.toString()}>
                      {m}月
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting || isLoadingOrgs || isLoadingDepts}
            className="ml-auto"
          >
            {isSubmitting ? <Spinner className="mr-2" /> : null}
            生成记录骨架
          </Button>
        </CardFooter>
      </Card>
      
      {result && (
        <Card>
          <CardHeader>
            <CardTitle>生成结果</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted p-4 rounded-md">
              <p>
                <span className="font-semibold">新建记录数:</span> {result.createdCount}
              </p>
              <p>
                <span className="font-semibold">已存在记录数:</span> {result.skippedCount}
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                已存在的记录会被跳过，不会重复创建
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 