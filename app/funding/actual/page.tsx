"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { ActualPaymentForm } from "./actual-payment-form"
import type { ActualPayment } from "./columns"

const initialData: ActualPayment[] = [
  { id: 1, project: "智慧城市项目", amount: 100000, date: "2024-09-15", status: "已支付" },
  { id: 2, project: "5G网络建设", amount: 200000, date: "2024-09-20", status: "待审核" },
  { id: 3, project: "数据中心扩建", amount: 150000, date: "2024-09-25", status: "已支付" },
  { id: 4, project: "AI研发项目", amount: 300000, date: "2024-09-30", status: "待支付" },
]

export default function ActualPaymentPage() {
  const [data, setData] = useState<ActualPayment[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(
    (payment) =>
      payment.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddPayment = (newPayment: Omit<ActualPayment, "id">) => {
    const id = Math.max(...data.map((p) => p.id)) + 1
    setData([...data, { ...newPayment, id }])
  }

  const handleEditPayment = (editedPayment: ActualPayment) => {
    setData(data.map((payment) => (payment.id === editedPayment.id ? editedPayment : payment)))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">实际支付填报</h1>
        <ActualPaymentForm onSubmit={handleAddPayment} />
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索支付记录..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable columns={columns} data={filteredData} onEdit={handleEditPayment} />
    </div>
  )
}

