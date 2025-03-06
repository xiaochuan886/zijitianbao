"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle, ArrowRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Organization {
  id: string;
  name: string;
  code: string;
  activeRecordsCount: number;
  userRecordsCount: number;
  financeRecordsCount: number;
  auditedRecordsCount: number;
  canAudit: boolean;
  pendingAuditCount: number;
}

interface AuditData {
  success: boolean;
  data: Organization[];
  currentPeriod: {
    year: number;
    month: number;
  };
}

export default function AuditPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/audit/organizations");
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.message || "获取机构列表失败");
        }

        setAuditData(data);
      } catch (err) {
        console.error("获取机构列表失败:", err);
        setError(err instanceof Error ? err.message : "获取机构列表失败");
        toast.error("获取机构列表失败");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleAuditClick = (organizationId: string) => {
    router.push(`/admin/audit/${organizationId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">机构审核</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={index} className="shadow-md">
              <CardHeader className="pb-2">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <h1 className="text-2xl font-bold mb-6">机构审核</h1>
        <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-center text-red-700">
          <AlertCircle className="h-5 w-5 mr-2" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">机构审核</h1>
        <Badge variant="outline" className="text-sm">
          当前期间: {auditData?.currentPeriod?.year}年{auditData?.currentPeriod?.month}月
        </Badge>
      </div>

      {auditData?.data.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-yellow-700">
          当前没有需要审核的机构数据
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {auditData?.data.map((org) => {
            // 计算进度百分比
            const userProgressPercent = org.activeRecordsCount > 0 
              ? Math.round((org.userRecordsCount / org.activeRecordsCount) * 100) 
              : 0;
            
            const financeProgressPercent = org.activeRecordsCount > 0 
              ? Math.round((org.financeRecordsCount / org.activeRecordsCount) * 100) 
              : 0;
            
            const auditProgressPercent = org.financeRecordsCount > 0 
              ? Math.round((org.auditedRecordsCount / org.financeRecordsCount) * 100) 
              : 0;
            
            return (
              <Card key={org.id} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span>{org.name}</span>
                    <Badge variant="outline">{org.code}</Badge>
                  </CardTitle>
                  <CardDescription>
                    活跃记录: {org.activeRecordsCount}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">填报人报表:</span>
                        <Badge variant={userProgressPercent === 100 ? "secondary" : "outline"}>
                          {org.userRecordsCount}/{org.activeRecordsCount}
                        </Badge>
                      </div>
                      <Progress value={userProgressPercent} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">财务报表:</span>
                        <Badge variant={financeProgressPercent === 100 ? "secondary" : "outline"}>
                          {org.financeRecordsCount}/{org.activeRecordsCount}
                        </Badge>
                      </div>
                      <Progress value={financeProgressPercent} className="h-2" />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">已审核:</span>
                        <Badge variant={auditProgressPercent === 100 ? "secondary" : "outline"}>
                          {org.auditedRecordsCount}/{org.financeRecordsCount || org.activeRecordsCount}
                        </Badge>
                      </div>
                      <Progress value={auditProgressPercent} className="h-2" />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => handleAuditClick(org.id)}
                    disabled={!org.canAudit}
                    variant={org.canAudit ? "default" : "outline"}
                  >
                    {org.canAudit ? (
                      <>
                        审核 ({org.pendingAuditCount}) <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    ) : (
                      <>
                        {org.userRecordsCount === 0 || org.financeRecordsCount === 0 ? 
                          "等待填报完成" : 
                          org.auditedRecordsCount === org.financeRecordsCount ? 
                            "已全部审核" : "等待审核"
                        }
                        {(org.userRecordsCount === 0 || org.financeRecordsCount === 0) && 
                          <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        }
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
} 