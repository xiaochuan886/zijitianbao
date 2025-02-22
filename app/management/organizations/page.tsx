import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { PlusCircle } from "lucide-react"
import { columns } from "./columns"

const data = [
  { id: 1, name: "北京分公司", code: "BJ001", departments: 5, projects: 10 },
  { id: 2, name: "上海分公司", code: "SH001", departments: 4, projects: 8 },
  { id: 3, name: "广州分公司", code: "GZ001", departments: 3, projects: 6 },
  { id: 4, name: "深圳分公司", code: "SZ001", departments: 3, projects: 5 },
]

export default function OrganizationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">机构管理</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增机构
        </Button>
      </div>
      <DataTable columns={columns} data={data} />
    </div>
  )
}

