"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { CSVLink } from "react-csv"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export type QueryResult = {
  id: number
  project: string
  type: string
  month: string
  amount: number
}

const initialData: QueryResult[] = [
  { id: 1, project: "智慧城市项目", type: "预测", month: "2024-09", amount: 100000 },
  { id: 2, project: "5G网络建设", type: "实际", month: "2024-08", amount: 180000 },
  { id: 3, project: "数据中心扩建", type: "预测", month: "2024-09", amount: 150000 },
  { id: 4, project: "AI研发项目", type: "实际", month: "2024-08", amount: 280000 },
  { id: 5, project: "智慧城市项目", type: "实际", month: "2024-08", amount: 90000 },
  { id: 6, project: "5G网络建设", type: "预测", month: "2024-09", amount: 200000 },
  { id: 7, project: "数据中心扩建", type: "实际", month: "2024-08", amount: 140000 },
  { id: 8, project: "AI研发项目", type: "预测", month: "2024-09", amount: 300000 },
]

export default function QueryPage() {
  const [data, setData] = useState<QueryResult[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(
    (record) =>
      record.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.month.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const chartData = data.reduce((acc, curr) => {
    const existingProject = acc.find((item) => item.project === curr.project)
    if (existingProject) {
      existingProject[curr.type] = curr.amount
    } else {
      acc.push({
        project: curr.project,
        [curr.type]: curr.amount,
      })
    }
    return acc
  }, [] as any[])

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">数据查询</h1>
        <CSVLink data={filteredData} filename={"query_results.csv"}>
          <Button>导出CSV</Button>
        </CSVLink>
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索记录..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable columns={columns} data={filteredData} />
      <Card>
        <CardHeader>
          <CardTitle>项目资金对比图</CardTitle>
          <CardDescription>预测金额与实际金额的对比</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="project" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="预测" fill="#8884d8" />
              <Bar dataKey="实际" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

