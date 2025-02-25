import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Organization } from "../columns"

const formSchema = z.object({
  name: z.string().min(2, {
    message: "机构名称至少需要2个字符",
  }),
  code: z.string().min(2, {
    message: "机构编码至少需要2个字符",
  }),
})

interface OrganizationFormProps {
  initialData?: Organization
  onSubmit: (data: z.infer<typeof formSchema>) => Promise<void>
  onCancel: () => void
}

export function OrganizationForm({
  initialData,
  onSubmit,
  onCancel,
}: OrganizationFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || "",
      code: initialData?.code || "",
    },
  })

  async function handleSubmit(values: z.infer<typeof formSchema>) {
    try {
      await onSubmit(values)
      form.reset()
      toast.success(initialData ? "机构信息已更新" : "机构创建成功")
    } catch (error) {
      toast.error("操作失败，请重试")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>机构名称</FormLabel>
              <FormControl>
                <Input placeholder="请输入机构名称" {...field} />
              </FormControl>
              <FormDescription>
                这是机构的正式名称，将用于显示和识别
              </FormDescription>
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
              <FormDescription>
                机构的唯一标识符，用于系统内部识别
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit">
            {initialData ? "更新" : "创建"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 