import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import dynamic from "next/dynamic";

// 动态导入组件以避免找不到模块的错误
const WithdrawalRequestDetail = dynamic(() => import("./withdrawal-request-detail").then(mod => mod.WithdrawalRequestDetail), {
  loading: () => <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div></div>,
  ssr: false
});

export const metadata: Metadata = {
  title: "撤回请求详情",
  description: "查看撤回请求的详细信息",
};

export default async function WithdrawalRequestDetailPage({
  params,
}: {
  params: { id: string };
}) {
  // 检查用户权限
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/auth/signin");
  }

  // 获取撤回请求详情
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || ""}/api/withdrawal-request/${params.id}`,
    {
      headers: {
        Cookie: cookies().toString(),
      },
      cache: "no-store",
    }
  );

  if (!response.ok) {
    if (response.status === 404) {
      redirect("/withdrawal-requests?error=not-found");
    }
    if (response.status === 403) {
      redirect("/withdrawal-requests?error=forbidden");
    }
    redirect("/withdrawal-requests?error=unknown");
  }

  const data = await response.json();
  const requestData = data.success ? data.data : null;

  if (!requestData) {
    redirect("/withdrawal-requests?error=no-data");
  }

  return (
    <div className="container mx-auto py-6">
      <WithdrawalRequestDetail 
        request={requestData} 
        isAdmin={session.user.role === "ADMIN"} 
      />
    </div>
  );
} 