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
import { PlusCircle } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import { useDebounce } from "@/hooks/use-debounce"

const formSchema = z.object({
  name: z.string().min(2, "机构名称至少2个字符").max(50, "机构名称最多50个字符"),
  code: z.string().min(2, "机构编码至少2个字符").max(20, "机构编码最多20个字符"),
  departments: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface CreateOrgDialogProps {
  onSuccess: () => void
}

export function CreateOrgDialog({ onSuccess }: CreateOrgDialogProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCheckingCode, setIsCheckingCode] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      code: "",
      departments: "",
    },
  })

  const debouncedCheckCode = useDebounce(async (code: string) => {
    if (code.length < 2) return
    try {
      setIsCheckingCode(true)
      const response = await fetch(`/api/organizations/check-code?code=${encodeURIComponent(code)}`)
      if (!response.ok) {
        const error = await response.json()
        form.setError("code", { message: error.message || "机构编码已存在" })
      } else {
        form.clearErrors("code")
      }
    } catch (error) {
      console.error("检查机构编码失败:", error)
    } finally {
      setIsCheckingCode(false)
    }
  }, 500)

  const handleCodeChange = (value: string) => {
    form.setValue("code", value)
    debouncedCheckCode(value)
  }

  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
      
      // 处理部门列表
      const departments = values.departments
        ? values.departments
            .split(/[,，\n]/)
            .map(name => name.trim())
            .filter(name => name.length >= 2 && name.length <= 50)
        : []

      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          code: values.code,
          departments,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "创建机构失败")
      }

      toast.success("机构创建成功")
      form.reset()
      setOpen(false)
      onSuccess()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "创建机构失败")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          新增机构
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>新增机构</DialogTitle>
          <DialogDescription>
            请填写机构信息，创建后可以添加部门和用户。
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
                    <div className="relative">
                      <Input 
                        placeholder="请输入机构编码" 
                        {...field}
                        onChange={(e) => handleCodeChange(e.target.value)}
                      />
                      {isCheckingCode && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                          检查中...
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="departments"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>批量添加部门（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请输入部门名称，多个部门用逗号或换行分隔"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="submit"
                disabled={isSubmitting || isCheckingCode}
              >
                {isSubmitting ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 