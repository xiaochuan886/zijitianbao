'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';

// 项目分类接口
interface ProjectCategory {
  id: string;
  name: string;
  code?: string;
}

// 机构接口
interface Organization {
  id: string;
  name: string;
  departments: Department[];
}

// 部门接口
interface Department {
  id: string;
  name: string;
}

// 资金类型接口
interface FundType {
  id: string;
  name: string;
}

// 详细资金需求接口
interface DetailedFundNeed {
  subProjectId: string;
  departmentId: string;
  fundTypeId: string;
  organizationId: string;
}

// 子项目接口
interface SubProject {
  name: string;
  detailedFundNeeds: DetailedFundNeed[];
}

// 项目表单验证模式
const projectSchema = z.object({
  name: z.string().min(2, '项目名称至少2个字符').max(100, '项目名称最多100个字符'),
  code: z.string().min(2, '项目编码至少2个字符').max(50, '项目编码最多50个字符'),
  startYear: z.number().min(2000, '开始年份不能早于2000年').max(2100, '开始年份不能晚于2100年'),
  categoryId: z.string().optional(),
  subProjects: z.array(z.object({
    name: z.string().min(2, '子项目名称至少2个字符'),
    detailedFundNeeds: z.array(z.object({
      organizationId: z.string().min(1, '请选择机构'),
      departmentId: z.string().min(1, '请选择部门'),
      fundTypeId: z.string().min(1, '请选择资金需求类型')
    })).min(1, '至少添加一个资金需求明细')
  })).min(1, '至少添加一个子项目')
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface ProjectFormProps {
  initialData?: any;
  onSubmit: (data: ProjectFormValues) => Promise<void>;
  onCancel: () => void;
}

export function ProjectForm({ initialData, onSubmit, onCancel }: ProjectFormProps) {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [fundTypes, setFundTypes] = useState<FundType[]>([]);
  
  // 获取项目分类列表
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/project-categories');
      
      if (!response.ok) {
        throw new Error('获取项目分类失败');
      }
      
      const data = await response.json();
      console.log('获取到的项目分类数据:', data);
      
      if (Array.isArray(data)) {
        setCategories(data);
      } else if (data && data.items) {
        setCategories(data.items);
      } else {
        console.error('项目分类数据格式不正确:', data);
        setCategories([]);
      }
    } catch (error) {
      console.error('获取项目分类列表失败:', error);
      setCategories([]);
    }
  };

  // 获取机构列表
  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      
      if (!response.ok) {
        throw new Error('获取机构列表失败');
      }
      
      const data = await response.json();
      console.log('获取到的机构数据:', data);
      
      if (Array.isArray(data)) {
        setOrganizations(data);
      } else if (data && Array.isArray(data.items)) {
        setOrganizations(data.items);
      } else {
        console.error('机构数据格式不正确:', data);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('获取机构列表失败:', error);
      setOrganizations([]);
    }
  };

  // 获取资金需求类型列表
  const fetchFundTypes = async () => {
    try {
      const response = await fetch('/api/funding-types');
      
      if (!response.ok) {
        throw new Error('获取资金需求类型失败');
      }
      
      const data = await response.json();
      console.log('获取到的资金类型数据:', data);
      
      if (data && data.data && data.data.items) {
        setFundTypes(data.data.items);
      } else if (data && Array.isArray(data.items)) {
        setFundTypes(data.items);
      } else if (Array.isArray(data)) {
        setFundTypes(data);
      } else {
        console.error('资金类型数据格式不正确:', data);
        setFundTypes([]);
      }
    } catch (error) {
      console.error('获取资金需求类型失败:', error);
      setFundTypes([]);
    }
  };

  // 初始化数据
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchCategories(),
          fetchOrganizations(),
          fetchFundTypes()
        ]);
      } catch (error) {
        console.error('初始化数据失败:', error);
        toast({
          title: '加载失败',
          description: '无法加载必要数据，请刷新页面重试',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 处理初始数据
  const processInitialData = () => {
    if (!initialData) {
      return {
        name: '',
        code: '',
        startYear: new Date().getFullYear(),
        categoryId: undefined,
        subProjects: [{ 
          name: '', 
          detailedFundNeeds: [{ 
            organizationId: undefined, 
            departmentId: undefined, 
            fundTypeId: undefined 
          }] 
        }]
      };
    }

    // 如果有初始数据，但格式不符合新的结构，进行转换
    if (initialData.departments && initialData.subProjects) {
      // 旧格式转换为新格式
      const convertedSubProjects = initialData.subProjects.map((subProject: any) => {
        const detailedFundNeeds = [];
        
        // 为每个部门和资金类型创建详细需求
        for (const dept of initialData.departments) {
          for (const fundTypeId of subProject.fundingTypes || []) {
            detailedFundNeeds.push({
              organizationId: dept.organizationId,
              departmentId: dept.departmentIds[0], // 简化处理，只取第一个部门
              fundTypeId
            });
          }
        }
        
        return {
          name: subProject.name,
          detailedFundNeeds: detailedFundNeeds.length > 0 ? detailedFundNeeds : [{ 
            organizationId: undefined, 
            departmentId: undefined, 
            fundTypeId: undefined 
          }]
        };
      });
      
      return {
        ...initialData,
        categoryId: initialData.categoryId || undefined,
        subProjects: convertedSubProjects
      };
    }
    
    // 已经是新格式，确保所有Select的value不是空字符串
    const processedData = {...initialData};
    
    // 处理categoryId
    if (processedData.categoryId === '') {
      processedData.categoryId = undefined;
    }
    
    // 处理子项目和资金需求明细
    if (processedData.subProjects) {
      processedData.subProjects = processedData.subProjects.map((subProject: any) => {
        if (subProject.detailedFundNeeds) {
          subProject.detailedFundNeeds = subProject.detailedFundNeeds.map((need: any) => ({
            ...need,
            organizationId: need.organizationId === '' ? undefined : need.organizationId,
            departmentId: need.departmentId === '' ? undefined : need.departmentId,
            fundTypeId: need.fundTypeId === '' ? undefined : need.fundTypeId
          }));
        }
        return subProject;
      });
    }
    
    return processedData;
  };

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: processInitialData()
  });

  const handleSubmit = async (data: ProjectFormValues) => {
    try {
      setLoading(true);
      console.log('表单提交数据:', data);
      
      // 检查数据是否有效
      if (!data.name || !data.code || !data.startYear) {
        toast({
          title: '提交失败',
          description: '基本信息不完整',
          variant: 'destructive'
        });
        return;
      }
      
      if (!data.subProjects || data.subProjects.length === 0) {
        toast({
          title: '提交失败',
          description: '未添加子项目',
          variant: 'destructive'
        });
        return;
      }
      
      // 检查每个子项目是否有效
      for (const sub of data.subProjects) {
        if (!sub.name) {
          toast({
            title: '提交失败',
            description: '存在未填写名称的子项目',
            variant: 'destructive'
          });
          return;
        }
        
        if (!sub.detailedFundNeeds || sub.detailedFundNeeds.length === 0) {
          toast({
            title: '提交失败',
            description: '存在未添加资金需求明细的子项目',
            variant: 'destructive'
          });
          return;
        }
        
        // 检查每个资金需求明细是否有效
        for (const need of sub.detailedFundNeeds) {
          if (!need.organizationId || !need.departmentId || !need.fundTypeId) {
            toast({
              title: '提交失败',
              description: '存在未完整填写的资金需求明细',
              variant: 'destructive'
            });
            return;
          }
        }
      }
      
      await onSubmit(data);
    } catch (error) {
      console.error('提交失败:', error);
      toast({
        title: '提交失败',
        description: '保存项目信息时发生错误',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // 添加子项目
  const addSubProject = () => {
    const subProjects = form.getValues('subProjects');
    form.setValue('subProjects', [
      ...subProjects, 
      { 
        name: '', 
        detailedFundNeeds: [{ 
          organizationId: undefined, 
          departmentId: undefined, 
          fundTypeId: undefined 
        }] 
      }
    ]);
  };

  // 删除子项目
  const removeSubProject = (index: number) => {
    const subProjects = form.getValues('subProjects');
    if (subProjects.length <= 1) return;
    
    form.setValue('subProjects', 
      subProjects.filter((_, i) => i !== index)
    );
  };

  // 添加资金需求明细
  const addDetailedFundNeed = (subProjectIndex: number) => {
    const subProjects = form.getValues('subProjects');
    const currentSubProject = subProjects[subProjectIndex];
    
    form.setValue(`subProjects.${subProjectIndex}.detailedFundNeeds`, [
      ...currentSubProject.detailedFundNeeds,
      { organizationId: undefined, departmentId: undefined, fundTypeId: undefined }
    ]);
  };

  // 删除资金需求明细
  const removeDetailedFundNeed = (subProjectIndex: number, needIndex: number) => {
    const subProjects = form.getValues('subProjects');
    const currentSubProject = subProjects[subProjectIndex];
    
    if (currentSubProject.detailedFundNeeds.length <= 1) return;
    
    form.setValue(
      `subProjects.${subProjectIndex}.detailedFundNeeds`,
      currentSubProject.detailedFundNeeds.filter((_, i) => i !== needIndex)
    );
  };

  // 获取指定机构的部门列表
  const getDepartmentsByOrgId = (orgId: string) => {
    const org = organizations.find(o => o.id === orgId);
    return org?.departments || [];
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <Card className="backdrop-blur-sm bg-card dark:bg-card/90">
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
                    value={field.value || undefined}
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

        {/* 子项目列表 */}
        <div className="space-y-4">
          {form.watch('subProjects').map((_, subProjectIndex) => (
            <Card key={subProjectIndex} className="backdrop-blur-sm bg-card dark:bg-card/90">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>子项目 {subProjectIndex + 1}</CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeSubProject(subProjectIndex)}
                  disabled={loading || form.watch('subProjects').length <= 1}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* 子项目名称 */}
                <FormField
                  control={form.control}
                  name={`subProjects.${subProjectIndex}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>子项目名称</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                
                {/* 资金需求明细标题和添加按钮 */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">资金需求明细</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => addDetailedFundNeed(subProjectIndex)}
                    disabled={loading}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    添加资金需求明细
                  </Button>
                </div>

                {/* 资金需求明细列表 */}
                <div className="space-y-4">
                  {form.watch(`subProjects.${subProjectIndex}.detailedFundNeeds`).map((_, needIndex) => (
                    <Card key={needIndex} className="p-4 border border-muted">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-4">
                          {/* 机构选择 */}
                          <FormField
                            control={form.control}
                            name={`subProjects.${subProjectIndex}.detailedFundNeeds.${needIndex}.organizationId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>机构</FormLabel>
                                <Select
                                  value={field.value || undefined}
                                  onValueChange={(value) => {
                                    field.onChange(value);
                                    // 清空部门选择，因为机构变了
                                    form.setValue(
                                      `subProjects.${subProjectIndex}.detailedFundNeeds.${needIndex}.departmentId`, 
                                      undefined
                                    );
                                  }}
                                  disabled={loading}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="选择机构" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {organizations.map((org) => (
                                      <SelectItem key={org.id} value={org.id}>
                                        {org.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* 部门选择 */}
                          <FormField
                            control={form.control}
                            name={`subProjects.${subProjectIndex}.detailedFundNeeds.${needIndex}.departmentId`}
                            render={({ field }) => {
                              const orgId = form.watch(
                                `subProjects.${subProjectIndex}.detailedFundNeeds.${needIndex}.organizationId`
                              );
                              const departments = getDepartmentsByOrgId(orgId);
                              
                              return (
                                <FormItem>
                                  <FormLabel>部门</FormLabel>
                                  <Select
                                    value={field.value || undefined}
                                    onValueChange={field.onChange}
                                    disabled={loading || !orgId || departments.length === 0}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="选择部门" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                          {dept.name}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              );
                            }}
                          />

                          {/* 资金需求类型选择 */}
                          <FormField
                            control={form.control}
                            name={`subProjects.${subProjectIndex}.detailedFundNeeds.${needIndex}.fundTypeId`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>资金需求类型</FormLabel>
                                <Select
                                  value={field.value || undefined}
                                  onValueChange={field.onChange}
                                  disabled={loading || fundTypes.length === 0}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="选择资金需求类型" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {fundTypes.map((type) => (
                                      <SelectItem key={type.id} value={type.id}>
                                        {type.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        {/* 删除按钮 */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDetailedFundNeed(subProjectIndex, needIndex)}
                          disabled={loading || form.watch(`subProjects.${subProjectIndex}.detailedFundNeeds`).length <= 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 添加子项目按钮 */}
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={addSubProject}
          disabled={loading}
        >
          <Plus className="w-4 h-4 mr-2" />
          添加子项目
        </Button>

        {/* 表单操作按钮 */}
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