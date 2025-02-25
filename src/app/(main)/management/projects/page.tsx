"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { ProjectForm } from "./project-form"
import type { Project } from "./columns"

const initialData: Project[] = [
  {
    id: 1,
    name: "智慧城市项目",
    organization: "北京分公司",
    status: "进行中",
    budget: 1000000,
    startDate: "2024-01-01",
  },
  { id: 2, name: "5G网络建设", organization: "上海分公司", status: "规划中", budget: 2000000, startDate: "2024-03-01" },
  {
    id: 3,
    name: "数据中心扩建",
    organization: "广州分公司",
    status: "已完成",
    budget: 1500000,
    startDate: "2023-06-01",
  },
  { id: 4, name: "AI研发项目", organization: "深圳分公司", status: "进行中", budget: 3000000, startDate: "2024-02-15" },
]

export default function ProjectsPage() {
  const [data, setData] = useState<Project[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: initialData.length,
    totalPages: Math.ceil(initialData.length / 10)
  })

  const filteredData = data.filter(
    (project) =>
      project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.status.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const paginatedData = filteredData.slice(
    (pagination.page - 1) * pagination.pageSize,
    pagination.page * pagination.pageSize
  )

  const total = filteredData.length;
  const totalPages = Math.ceil(total / pagination.pageSize);

  const handleAddProject = (newProject: Omit<Project, "id">) => {
    const id = Math.max(...data.map((p) => p.id)) + 1
    setData([...data, { ...newProject, id }])
  }

  const handleEditProject = (data: Partial<Project> & { id: number }) => {
    const editedProject: Project = {
      id: data.id,
      name: data.name || '',
      organization: data.organization || '',
      status: data.status || '',
      budget: data.budget || 0,
      startDate: data.startDate || ''
    };
    setData(prevData => prevData.map(project => project.id === editedProject.id ? editedProject : project));
  }

  const handlePaginationChange = (newPagination: { page: number; pageSize: number }) => {
    setPagination({
      ...pagination,
      ...newPagination,
      total,
      totalPages
    });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination({
      ...pagination,
      page: 1,
      total,
      totalPages
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">项目管理</h1>
        <ProjectForm onSubmit={handleAddProject} />
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索项目..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
      </div>
      <DataTable 
        columns={columns} 
        data={paginatedData} 
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        onEdit={handleEditProject} 
      />
    </div>
  )
}

