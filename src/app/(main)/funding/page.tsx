"use client"

import { redirect } from "next/navigation"
import { CardLayout } from "@/components/card-layout"
import { DashboardStats } from "@/components/dashboard-stats"
import { DataTable } from "@/components/data-table"
import { FundingForm } from "@/components/funding-form"
import { MultiStepForm } from "@/components/multi-step-form"
import { RoleBasedUI } from "@/components/role-based-ui"

const stats = [
  { title: "Total Projects", value: "12", description: "2 added this month" },
  { title: "Total Funding", value: "$1.2M", description: "10% increase from last month" },
  { title: "Pending Approvals", value: "5", description: "3 urgent" },
  { title: "Completed Reports", value: "25", description: "98% on time" },
]

const columns = [
  { accessorKey: "projectName", header: "Project Name" },
  { accessorKey: "amount", header: "Amount" },
  { accessorKey: "date", header: "Date" },
]

const data = [
  { projectName: "Project A", amount: 100000, date: "2024-09-01" },
  { projectName: "Project B", amount: 250000, date: "2024-10-15" },
  { projectName: "Project C", amount: 75000, date: "2024-11-30" },
]

export default function FundingPage() {
  redirect("/funding/predict-v2")
}

