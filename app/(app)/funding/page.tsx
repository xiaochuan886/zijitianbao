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
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">资金填报</h1>
      <div className="grid gap-6">
        <DashboardStats stats={stats} />

        <CardLayout title="Funding Form" description="Enter funding details">
          <RoleBasedUI roles={["admin", "manager"]}>
            <FundingForm type="PredictTable" onSubmit={(data) => console.log(data)} />
          </RoleBasedUI>
        </CardLayout>

        <CardLayout title="Funding Data" description="Overview of funding data">
          <DataTable columns={columns} data={data} />
        </CardLayout>

        <CardLayout title="Multi-Step Form" description="Complete the funding process">
          <MultiStepForm
            steps={[
              {
                id: "1",
                name: "Project Details",
                fields: <FundingForm type="PredictTable" onSubmit={(data) => console.log(data)} />,
              },
              { id: "2", name: "Review", fields: <div>Review step content</div> },
              { id: "3", name: "Submit", fields: <div>Submit step content</div> },
            ]}
            onSubmit={(data) => console.log(data)}
          />
        </CardLayout>
      </div>
    </div>
  )
}

