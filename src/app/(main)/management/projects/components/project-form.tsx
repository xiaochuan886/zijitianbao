'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { OrganizationSelector } from './organization-selector';
import { SubProjectForm } from './sub-project-form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

// 项目分类接口
interface ProjectCategory {
  id: string;
  name: string;
  code?: string;
  organizationId: string;
}

const projectSchema = z.object({
  name: z.string().min(2, '项目名称至少2个字符').max(100, '项目名称最多100个字符'),
  code: z.string().min(2, '项目编码至少2个字符').max(50, '项目编码最多50个字符'),
  startYear: z.number().min(2000, '开始年份不能早于2000年').max(2100, '开始年份不能晚于2100年'),
  categoryId: z.string().optional(),
  departments: z.array(z.object({
    organizationId: z.string().min(1, '请选择机构'),
    departmentIds: z.array(z.string()).min(1, '至少选择一个部门')
  })).min(1, '至少选择一个机构和部门'),
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
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');

  // 获取项目分类列表
  const fetchCategories = async (organizationId?: string) => {
    try {
      const token = localStorage.getItem('token');
      let url = '/api/project-categories';
      if (organizationId) {
        url += `?organizationId=${organizationId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      if (data && data.items) {
        setCategories(data.items);
      } else if (Array.isArray(data)) {
        setCategories(data);
      } else {
        console.error('项目分类数据格式不正确:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('获取项目分类列表失败:', error);
      setCategories([]);
    }
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: initialData || {
      name: '',
      code: '',
      startYear: new Date().getFullYear(),
      categoryId: '',
      departments: [{ organizationId: '', departmentIds: [] }],
      subProjects: [{ name: '', fundingTypes: [] }]
    }
  });

  // 监听机构变化，更新分类列表
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (value?.departments?.[0]?.organizationId) {
        const orgId = value.departments[0].organizationId;
        if (orgId !== selectedOrgId) {
          setSelectedOrgId(orgId);
          fetchCategories(orgId);
        }
      }
    });
    
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.watch, selectedOrgId]);

  // 初始化时加载分类
  useEffect(() => {
    if (initialData?.departments && initialData.departments.length > 0) {
      const orgId = initialData.departments[0].organizationId;
      if (orgId) {
        setSelectedOrgId(orgId);
        fetchCategories(orgId);
      }
    } else {
      fetchCategories();
    }
  }, [initialData]);

  const handleSubmit = async (data: ProjectFormValues) => {
    try {
      setLoading(true);
      console.log('表单提交数据:', data); // 添加日志，查看提交的数据
      
      // 检查数据是否有效
      if (!data.name || !data.code || !data.startYear) {
        console.error('基本信息不完整');
        return;
      }
      
      if (!data.departments || data.departments.length === 0) {
        console.error('未选择机构和部门');
        return;
      }
      
      if (!data.subProjects || data.subProjects.length === 0) {
        console.error('未添加子项目');
        return;
      }
      
      // 检查每个机构和部门是否有效
      for (const dept of data.departments) {
        if (!dept.organizationId) {
          console.error('存在未选择机构的项');
          return;
        }
        if (!dept.departmentIds || dept.departmentIds.length === 0) {
          console.error('存在未选择部门的项');
          return;
        }
      }
      
      // 检查每个子项目是否有效
      for (const sub of data.subProjects) {
        if (!sub.name) {
          console.error('存在未填写名称的子项目');
          return;
        }
        if (!sub.fundingTypes || sub.fundingTypes.length === 0) {
          console.error('存在未选择资金需求类型的子项目');
          return;
        }
      }
      
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
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>项目分类</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading || categories.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择项目分类" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name} {category.code ? `(${category.code})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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