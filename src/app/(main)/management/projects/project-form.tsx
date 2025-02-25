"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import type { Project } from "./columns"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "项目名称至少需要2个字符。",
  }),
  organizations: z.array(z.string()).min(1, {
    message: "请至少选择一个机构。",
  }),
  departments: z.array(z.string()).optional(),
  status: z.string({
    required_error: "请选择项目状态。",
  }),
  startYear: z.number().min(2024, {
    message: "开始年份不能早于2024年。",
  }),
  subProjects: z.array(z.object({
    name: z.string().min(2, { message: "子项目名称至少需要2个字符。" }),
    fundingType: z.string({ required_error: "请选择资金需求类型。" })
  })).min(1, {
    message: "请至少添加一个子项目。",
  })
})

interface ProjectFormProps {
  initialData?: Project
  onSubmit: (data: z.infer<typeof formSchema>) => void
}

export function ProjectForm({ initialData, onSubmit }: ProjectFormProps) {
  const [open, setOpen] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData || {
      name: "",
      organizations: [],
      departments: [],
      status: "规划中",
      startYear: new Date().getFullYear(),
      subProjects: []
    },
  })

  function handleSubmit(values: z.infer<typeof formSchema>) {
    onSubmit(values)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{initialData ? "编辑项目" : "新增项目"}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "编辑项目" : "新增项目"}</DialogTitle>
          <DialogDescription>
            {initialData ? "修改项目信息。完成后点击保存。" : "在此添加新项目。完成后点击创建。"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目名称</FormLabel>
                  <FormControl>
                    <Input placeholder="输入项目名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="organization"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>所属机构</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择所属机构" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="北京分公司">北京分公司</SelectItem>
                      <SelectItem value="上海分公司">上海分公司</SelectItem>
                      <SelectItem value="广州分公司">广州分公司</SelectItem>
                      <SelectItem value="深圳分公司">深圳分公司</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目状态</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择项目状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="规划中">规划中</SelectItem>
                      <SelectItem value="进行中">进行中</SelectItem>
                      <SelectItem value="已完成">已完成</SelectItem>
                      <SelectItem value="已暂停">已暂停</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>开始年份</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2024}
                      placeholder="输入开始年份"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">子项目</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const subProjects = form.getValues("subProjects") || [];
                    form.setValue("subProjects", [
                      ...subProjects,
                      { name: "", fundingType: "" },
                    ]);
                  }}
                >
                  添加子项目
                </Button>
              </div>
              {form.watch("subProjects")?.map((_, index) => (
                <div key={index} className="flex gap-4">
                  <FormField
                    control={form.control}
                    name={`subProjects.${index}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input placeholder="子项目名称" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`subProjects.${index}.fundingType`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="资金需求类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="capital">资本性支出</SelectItem>
                            <SelectItem value="operating">经营性支出</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const subProjects = form.getValues("subProjects");
                      form.setValue(
                        "subProjects",
                        subProjects.filter((_, i) => i !== index)
                      );
                    }}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button type="submit">{initialData ? "保存更改" : "创建项目"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

