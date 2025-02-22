"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { UserForm } from "./user-form"
import type { User } from "./columns"

const initialData: User[] = [
  { id: "1", name: "Admin User", email: "admin@example.com", role: "admin" },
  { id: "2", name: "Manager User", email: "manager@example.com", role: "manager" },
  { id: "3", name: "Regular User", email: "user@example.com", role: "user" },
]

export default function UsersPage() {
  const [data, setData] = useState<User[]>(initialData)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredData = data.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.role.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleAddUser = (newUser: Omit<User, "id">) => {
    const id = Math.max(...data.map((u) => Number.parseInt(u.id))) + 1
    setData([...data, { ...newUser, id: id.toString() }])
  }

  const handleEditUser = (editedUser: User) => {
    setData(data.map((user) => (user.id === editedUser.id ? editedUser : user)))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">用户管理</h1>
        <UserForm onSubmit={handleAddUser} />
      </div>
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索用户..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable columns={columns} data={filteredData} onEdit={handleEditUser} />
    </div>
  )
}

