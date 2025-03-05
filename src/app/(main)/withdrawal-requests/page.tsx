import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";

// 动态导入组件以避免找不到模块的错误
const WithdrawalRequestList = dynamic(() => import("./withdrawal-request-list").then(mod => mod.WithdrawalRequestList), {
  loading: () => <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>,
  ssr: false
});

export const metadata: Metadata = {
  title: "撤回请求管理",
  description: "查看和管理撤回请求",
};

export default async function WithdrawalRequestsPage() {
  // 检查用户权限
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 获取撤回请求列表
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ""}/api/withdrawal-request?page=1&pageSize=10`,
    {
      headers: {
        Cookie: cookies().toString(),
      },
      cache: "no-store",
    }
  );

  const data = await response.json();
  const initialRequests = data.success ? data.data : { requests: [], pagination: { total: 0 } };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">撤回请求管理</h1>
      </div>
      
      <WithdrawalRequestList initialData={initialRequests} isAdmin={session.user.role === "ADMIN"} />
    </div>
  );
} 