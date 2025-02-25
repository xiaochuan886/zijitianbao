'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { OrganizationSelector } from './organization-selector';
import { SubProjectForm } from './sub-project-form';

const projectSchema = z.object({
  name: z.string().min(2, '项目名称至少2个字符').max(100, '项目名称最多100个字符'),
  code: z.string().min(2, '项目编码至少2个字符').max(50, '项目编码最多50个字符'),
  startYear: z.number().min(2000, '开始年份不能早于2000年').max(2100, '开始年份不能晚于2100年'),
  organizations: z.array(z.string()).min(1, '至少选择一个机构'),
  departments: z.array(z.object({
    organizationId: z.string(),
    departmentIds: z.array(z.string()).min(1, '至少选择一个部门')
  })),
  subProjects: z.array(z.object({
    name: z.string().min(2, '子项目名称至少2个字符'),
    fundingTypes: z.array(z.string()).min(1, '至少选择一个资金需求类型')
  })).min(1, '至少添加一个子项目')
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: ProjectFormValues;
  onSubmit: (data: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSubmit, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([]);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      name: '',
      code: '',
      startYear: new Date().getFullYear(),
      organizations: [],
      departments: [],
      subProjects: [{ name: '', fundingTypes: [] }]
    }
  });

  const handleSubmit = async (data: ProjectFormValues) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目名称</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
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
                  <FormLabel>项目编码</FormLabel>
                  <FormControl>
                    <Input {...field} disabled={loading} />
                  </FormControl>
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
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>机构与部门</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="departments"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <OrganizationSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>子项目</CardTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                const subProjects = form.getValues('subProjects');
                form.setValue('subProjects', [...subProjects, { name: '', fundingTypes: [] }]);
              }}
              disabled={loading}
            >
              <Plus className="w-4 h-4 mr-2" />
              添加子项目
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <SubProjectForm form={form} disabled={loading} />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            保存
          </Button>
        </div>
      </form>
    </Form>
  );
}