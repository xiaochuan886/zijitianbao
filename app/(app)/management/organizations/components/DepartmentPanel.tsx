"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Organization } from "../columns"
import { Pencil, Plus, Trash, ChevronRight, ChevronDown } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface Department {
  id: number
  name: string
  parentId: number | null
  order: number
  children?: Department[]
}

interface DepartmentTreeProps {
  departments: Department[]
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
  onDragEnd: (event: DragEndEvent) => void
}

function SortableDepartment({ department, onEdit, onDelete, children }: {
  department: Department
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
  children?: React.ReactNode
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: department.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    backgroundColor: isDragging ? "var(--accent)" : undefined,
  }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  )
}

function DepartmentTree({ departments, onEdit, onDelete, onDragEnd }: DepartmentTreeProps) {
  const [expandedIds, setExpandedIds] = useState<number[]>([])
  const sensors = useSensors(useSensor(PointerSensor))

  const toggleExpand = (id: number) => {
    setExpandedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    )
  }

  // 扁平化部门列表，包括所有子部门
  const flattenDepartments = (deps: Department[]): Department[] => {
    return deps.reduce((acc: Department[], dep) => {
      acc.push(dep)
      if (dep.children?.length) {
        acc.push(...flattenDepartments(dep.children))
      }
      return acc
    }, [])
  }

  const renderDepartment = (department: Department) => {
    const hasChildren = (department.children ?? []).length > 0
    const isExpanded = expandedIds.includes(department.id)

    const content = (
      <div className="flex items-center space-x-2 py-2 px-2 rounded-md hover:bg-accent">
        {hasChildren && (
          <Button
            variant="ghost"
            size="icon"
            className="h-4 w-4"
            onClick={() => toggleExpand(department.id)}
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </Button>
        )}
        <span className="flex-1">{department.name}</span>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(department)}
            aria-label={`编辑${department.name}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`删除${department.name}`}>
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除</AlertDialogTitle>
                <AlertDialogDescription>
                  确定要删除部门 "{department.name}" 吗？此操作不可撤销。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>取消</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(department)}
                  aria-label={`确认删除${department.name}`}
                >
                  确认删除
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    )

    return (
      <div key={department.id} className="pl-4">
        <SortableDepartment
          department={department}
          onEdit={onEdit}
          onDelete={onDelete}
        >
          {content}
        </SortableDepartment>
        {hasChildren && isExpanded && department.children && (
          <div className="pl-4">
            {department.children.map(child => renderDepartment(child))}
          </div>
        )}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={flattenDepartments(departments).map(d => d.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {departments.map(department => renderDepartment(department))}
        </div>
      </SortableContext>
    </DndContext>
  )
}

const formSchema = z.object({
  name: z.string().min(2, "部门名称至少2个字符").max(50, "部门名称最多50个字符"),
  parentId: z.number().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface DepartmentPanelProps {
  organization: Organization
  onSuccess: () => void
  trigger: React.ReactNode
}

export function DepartmentPanel({ organization, onSuccess, trigger }: DepartmentPanelProps) {
  const [open, setOpen] = useState(false)
  const [departments, setDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null)
  const [batchAddOpen, setBatchAddOpen] = useState(false)
  const [batchAddValue, setBatchAddValue] = useState("")

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      parentId: null,
    },
  })

  const fetchDepartments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/organizations/${organization.id}/departments`)
      if (!response.ok) {
        throw new Error("获取部门列表失败")
      }
      const data = await response.json()
      setDepartments(buildDepartmentTree(data))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "获取部门列表失败")
    } finally {
      setIsLoading(false)
    }
  }

  const buildDepartmentTree = (departments: Department[]): Department[] => {
    const map = new Map<number, Department>()
    const roots: Department[] = []

    // 创建映射
    departments.forEach(dept => {
      map.set(dept.id, { ...dept, children: [] })
    })

    // 构建树
    departments.forEach(dept => {
      const node = map.get(dept.id)!
      if (dept.parentId === null) {
        roots.push(node)
      } else {
        const parent = map.get(dept.parentId)
        if (parent) {
          parent.children = parent.children || []
          parent.children.push(node)
        }
      }
    })

    // 排序
    const sortDepartments = (deps: Department[]) => {
      deps.sort((a, b) => a.order - b.order)
      deps.forEach(dep => {
        if (dep.children) {
          sortDepartments(dep.children)
        }
      })
    }
    sortDepartments(roots)

    return roots
  }

  const handleSubmit = async (values: FormValues) => {
    try {
      const url = editingDepartment
        ? `/api/organizations/${organization.id}/departments/${editingDepartment.id}`
        : `/api/organizations/${organization.id}/departments`
      const method = editingDepartment ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          parentId: values.parentId === null || values.parentId === undefined ? null : values.parentId
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || `${editingDepartment ? "更新" : "创建"}部门失败`)
        return
      }

      toast.success(`部门${editingDepartment ? "更新" : "创建"}成功`)
      form.reset()
      setEditingDepartment(null)
      fetchDepartments()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `${editingDepartment ? "更新" : "创建"}部门失败`)
    }
  }

  const handleDelete = async (department: Department) => {
    try {
      const response = await fetch(
        `/api/organizations/${organization.id}/departments/${department.id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          }
        }
      )

      if (!response.ok) {
        const error = await response.json()
        toast.error(error.message || "删除部门失败")
        return
      }

      toast.success("部门删除成功")
      fetchDepartments()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "删除部门失败")
    }
  }

  const handleEdit = (department: Department) => {
    setEditingDepartment(department)
    form.setValue("name", department.name)
    form.setValue("parentId", department.parentId)
  }

  const handleCancel = () => {
    setEditingDepartment(null)
    form.reset()
  }

  const handleBatchAdd = async () => {
    try {
      const names = batchAddValue
        .split("\n")
        .map(name => name.trim())
        .filter(name => name.length >= 2 && name.length <= 50)

      if (names.length === 0) {
        toast.error("请输入有效的部门名称（每行一个，2-50个字符）")
        return
      }

      const parentId = form.getValues("parentId")
      const responses = await Promise.all(
        names.map(name =>
          fetch(`/api/organizations/${organization.id}/departments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ name, parentId }),
          })
        )
      )

      const hasError = responses.some(response => !response.ok)
      if (hasError) {
        throw new Error("部分部门创建失败")
      }

      toast.success(`成功创建 ${names.length} 个部门`)
      setBatchAddOpen(false)
      setBatchAddValue("")
      fetchDepartments()
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "批量创建部门失败")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = departments.findIndex(d => d.id === active.id)
    const newIndex = departments.findIndex(d => d.id === over.id)

    const newDepartments = arrayMove(departments, oldIndex, newIndex)
    setDepartments(newDepartments)

    try {
      const response = await fetch(
        `/api/organizations/${organization.id}/departments/reorder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            departmentId: active.id,
            newOrder: newIndex,
          }),
        }
      )

      if (!response.ok) {
        throw new Error("更新部门顺序失败")
      }

      toast.success("部门顺序更新成功")
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新部门顺序失败")
      // 恢复原始顺序
      setDepartments(departments)
    }
  }

  const renderDepartmentOptions = (departments: Department[], level = 0): React.ReactNode[] => {
    return departments.flatMap(dept => [
      <SelectItem key={dept.id} value={dept.id.toString()}>
        {"\u00A0".repeat(level * 2)}{dept.name}
      </SelectItem>,
      ...(dept.children ? renderDepartmentOptions(dept.children, level + 1) : []),
    ])
  }

  return (
    <Sheet open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (isOpen) {
        fetchDepartments()
      } else {
        handleCancel()
      }
    }}>
      <SheetTrigger asChild>
        {trigger}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>部门管理</SheetTitle>
          <SheetDescription>
            管理 {organization.name} 的部门信息
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">添加部门</h3>
                <Dialog open={batchAddOpen} onOpenChange={setBatchAddOpen}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      aria-label="批量添加部门"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      批量添加
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>批量添加部门</DialogTitle>
                      <DialogDescription>
                        每行输入一个部门名称，将批量创建这些部门。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="names">部门名称列表</Label>
                        <Textarea
                          id="names"
                          value={batchAddValue}
                          onChange={(e) => setBatchAddValue(e.target.value)}
                          placeholder="例如：&#13;&#10;技术部&#13;&#10;市场部&#13;&#10;销售部"
                          className="min-h-[200px]"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setBatchAddOpen(false)}>
                        取消
                      </Button>
                      <Button type="button" onClick={handleBatchAdd}>
                        添加
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>部门名称</FormLabel>
                    <div className="flex space-x-2">
                      <FormControl>
                        <Input placeholder="请输入部门名称" {...field} />
                      </FormControl>
                      <Button type="submit" aria-label={editingDepartment ? "保存部门" : "新建部门"}>
                        {editingDepartment ? "保存" : "添加"}
                      </Button>
                      {editingDepartment && (
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          取消
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>上级部门</FormLabel>
                    <Select
                      value={field.value?.toString() ?? "null"}
                      onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="上级部门">
                          <SelectValue placeholder="选择上级部门（可选）" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="null">无上级部门</SelectItem>
                        {renderDepartmentOptions(departments)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>

          <div className="border rounded-md p-4">
            {isLoading ? (
              <div className="text-center py-4">加载中...</div>
            ) : departments.length === 0 ? (
              <div className="text-center py-4">暂无部门数据</div>
            ) : (
              <DepartmentTree
                departments={departments}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onDragEnd={handleDragEnd}
              />
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
} 