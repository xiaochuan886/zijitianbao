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
  organization: z.string({
    required_error: "请选择所属机构。",
  }),
  status: z.string({
    required_error: "请选择项目状态。",
  }),
  budget: z.coerce.number().min(0, {
    message: "预算不能为负数。",
  }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
    message: "请输入有效的日期格式 (YYYY-MM-DD)。",
  }),
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
      organization: "",
      status: "",
      budget: 0,
      startDate: "",
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
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>预算</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="输入项目预算" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>开始日期</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">{initialData ? "保存更改" : "创建项目"}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

