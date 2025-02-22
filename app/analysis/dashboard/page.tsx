"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

const data = [
  { month: "2024-01", 智慧城市项目: 80000, "5G网络建设": 120000, 数据中心扩建: 60000, AI研发项目: 100000 },
  { month: "2024-02", 智慧城市项目: 90000, "5G网络建设": 130000, 数据中心扩建: 70000, AI研发项目: 110000 },
  { month: "2024-03", 智慧城市项目: 100000, "5G网络建设": 140000, 数据中心扩建: 80000, AI研发项目: 120000 },
  { month: "2024-04", 智慧城市项目: 110000, "5G网络建设": 150000, 数据中心扩建: 90000, AI研发项目: 130000 },
  { month: "2024-05", 智慧城市项目: 120000, "5G网络建设": 160000, 数据中心扩建: 100000, AI研发项目: 140000 },
  { month: "2024-06", 智慧城市项目: 130000, "5G网络建设": 170000, 数据中心扩建: 110000, AI研发项目: 150000 },
]

const pieData = [
  { name: "智慧城市项目", value: 630000 },
  { name: "5G网络建设", value: 870000 },
  { name: "数据中心扩建", value: 510000 },
  { name: "AI研发项目", value: 750000 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function DashboardPage() {
  const [selectedProject, setSelectedProject] = useState("智慧城市项目")

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">数据看板</h1>
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>项目资金趋势</CardTitle>
            <CardDescription>各项目每月资金使用趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="智慧城市项目" stroke="#8884d8" />
                <Line type="monotone" dataKey="5G网络建设" stroke="#82ca9d" />
                <Line type="monotone" dataKey="数据中心扩建" stroke="#ffc658" />
                <Line type="monotone" dataKey="AI研发项目" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>项目资金分布</CardTitle>
            <CardDescription>各项目资金占比</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>单项目资金详情</CardTitle>
            <CardDescription>选择项目查看详细资金使用情况</CardDescription>
            <Select onValueChange={setSelectedProject} defaultValue={selectedProject}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="选择项目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="智慧城市项目">智慧城市项目</SelectItem>
                <SelectItem value="5G网络建设">5G网络建设</SelectItem>
                <SelectItem value="数据中心扩建">数据中心扩建</SelectItem>
                <SelectItem value="AI研发项目">AI研发项目</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey={selectedProject} fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

