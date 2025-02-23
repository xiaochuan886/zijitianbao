"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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

const formSchema = z.object({
  name: z.string().min(2, "机构名称至少2个字符").max(50, "机构名称最多50个字符"),
  code: z.string().min(2, "机构编码至少2个字符").max(20, "机构编码最多20个字符"),
})

type FormValues = z.infer<typeof formSchema>

interface EditOrgDialogProps {
  organization: Organization
  onSuccess: () => void
  trigger: React.ReactNode
}

export function EditOrgDialog({ organization, onSuccess, trigger }: EditOrgDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: organization.name,
      code: organization.code,
    },
  })

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "更新机构失败")
      }

      toast.success("机构更新成功")
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "更新机构失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑机构</DialogTitle>
          <DialogDescription>
            修改机构信息，保存后将立即生效。
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>机构名称</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入机构名称" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>机构编码</FormLabel>
                  <FormControl>
                    <Input placeholder="请输入机构编码" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "保存中..." : "保存"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 