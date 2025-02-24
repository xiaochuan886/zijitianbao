import { DashboardStats } from "@/components/dashboard-stats"
import { CardLayout } from "@/components/card-layout"

const stats = [
  { title: "总项目数", value: "12", description: "本月新增2个" },
  { title: "资金总额", value: "¥1.2M", description: "环比增长10%" },
  { title: "待审批", value: "5", description: "3个紧急" },
  { title: "已完成报告", value: "25", description: "98%按时完成" },
]

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">控制台</h1>
        <p className="text-muted-foreground mt-2">欢迎使用资金填报系统，这里展示了系统的关键指标和快捷入口。</p>
      </div>

      <DashboardStats stats={stats} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <CardLayout title="待办任务" description="需要您处理的事项">
          <div className="space-y-4">
            <p className="text-sm">• 3个待审核的资金预测</p>
            <p className="text-sm">• 2个待填报的实际支付</p>
            <p className="text-sm">• 1个待处理的数据差异</p>
          </div>
        </CardLayout>

        <CardLayout title="填报日历" description="重要时间节点">
          <div className="space-y-4">
            <p className="text-sm">• 预测填报截止日: 2024-09-15</p>
            <p className="text-sm">• 实际支付填报: 2024-09-20</p>
            <p className="text-sm">• 财务审核截止: 2024-09-25</p>
          </div>
        </CardLayout>

        <CardLayout title="系统公告" description="最新动态">
          <div className="space-y-4">
            <p className="text-sm">• 系统升级：新增数据导出功能</p>
            <p className="text-sm">• 政策更新：调整审核流程</p>
            <p className="text-sm">• 培训通知：新功能使用说明会</p>
          </div>
        </CardLayout>
      </div>
    </div>
  )
}

