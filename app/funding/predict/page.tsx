import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"

const data = [
  { id: 1, project: "智慧城市项目", month: "2024-09", amount: 100000, status: "草稿" },
  { id: 2, project: "5G网络建设", month: "2024-09", amount: 200000, status: "已提交" },
  { id: 3, project: "数据中心扩建", month: "2024-09", amount: 150000, status: "已审核" },
  { id: 4, project: "AI研发项目", month: "2024-09", amount: 300000, status: "草稿" },
]

export default function PredictPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">资金需求预测填报</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增预测
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}

