"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import type { AuditRecord } from "./columns"

const initialData: AuditRecord[] = [
  { id: 1, project: "智慧城市项目", amount: 100000, date: "2024-09-15", status: "待审核" },
  { id: 2, project: "5G网络建设", amount: 200000, date: "2024-09-20", status: "已通过" },
  { id: 3, project: "数据中心扩建", amount: 150000, date: "2024-09-25", status: "待审核" },
  { id: 4, project: "AI研发项目", amount: 300000, date: "2024-09-30", status: "已拒绝" },
]

export default function AuditPage() {
  const [data, setData] = useState<AuditRecord[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(
    (record) =>
      record.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAudit = (auditedRecord: AuditRecord) => {
    setData(data.map((record) => (record.id === auditedRecord.id ? auditedRecord : record)))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">财务审核</h1>
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索审核记录..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable columns={columns} data={filteredData} onEdit={handleAudit} />
    </div>
  )
}

