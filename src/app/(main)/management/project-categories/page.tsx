'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Plus, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface ProjectCategory {
  id: string;
  name: string;
  code?: string;
  organizationId: string;
  organization: {
    id: string;
    name: string;
  };
  createdAt: Date;
}

interface Organization {
  id: string;
  name: string;
}

interface RowType {
  original: {
    id: string;
    name: string;
    code?: string;
    organization: {
      id: string;
      name: string;
    };
  };
}

export default function ProjectCategoriesPage() {
  const [categories, setCategories] = useState<ProjectCategory[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProjectCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    organizationId: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchOrganizations();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/project-categories', {
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
      toast({
        variant: 'destructive',
        title: '错误',
        description: '获取项目分类列表失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/organizations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data && data.items) {
        setOrganizations(data.items);
      } else if (Array.isArray(data)) {
        setOrganizations(data);
      } else {
        console.error('机构数据格式不正确:', data);
        setOrganizations([]);
      }
    } catch (error) {
      console.error('获取机构列表失败:', error);
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: '分类名称',
    },
    {
      accessorKey: 'code',
      header: '分类编码',
    },
    {
      accessorKey: 'organization.name',
      header: '所属机构',
    },
    {
      accessorKey: 'actions',
      header: '操作',
      cell: ({ row }: { row: RowType }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original.id)}>
            编辑
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDelete(row.original.id)}>
            删除
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (id: string) => {
    const category = categories.find(c => c.id === id);
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        code: category.code || '',
        organizationId: category.organizationId
      });
      setShowForm(true);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个项目分类吗？')) return;
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/project-categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '删除失败');
      }
      
      toast({
        title: '成功',
        description: '项目分类已删除'
      });
      
      await fetchCategories();
    } catch (error: any) {
      console.error('删除项目分类失败:', error);
      toast({
        variant: 'destructive',
        title: '错误',
        description: error.message || '删除项目分类失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      code: '',
      organizationId: organizations.length > 0 ? organizations[0].id : ''
    });
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name) {
      toast({
        variant: 'destructive',
        title: '错误',
        description: '分类名称不能为空'
      });
      return;
    }
    
    if (!formData.organizationId) {
      toast({
        variant: 'destructive',
        title: '错误',
        description: '请选择所属机构'
      });
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = editingCategory 
        ? `/api/project-categories/${editingCategory.id}` 
        : '/api/project-categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '保存失败');
      }
      
      toast({
        title: '成功',
        description: `项目分类已${editingCategory ? '更新' : '创建'}`
      });
      
      setShowForm(false);
      await fetchCategories();
    } catch (error: any) {
      console.error('保存项目分类失败:', error);
      toast({
        variant: 'destructive',
        title: '错误',
        description: error.message || '保存项目分类失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleOrganizationChange = (value: string) => {
    setFormData(prev => ({ ...prev, organizationId: value }));
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/management/projects">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-semibold">项目分类管理</h1>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          新增分类
        </Button>
      </div>
      
      {loading && !showForm ? (
        <div className="flex justify-center items-center h-64">
          <p>加载中...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
        />
      )}
      
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCategory ? '编辑项目分类' : '新增项目分类'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  分类名称
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="code" className="text-right">
                  分类编码
                </Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="organizationId" className="text-right">
                  所属机构
                </Label>
                <Select
                  value={formData.organizationId}
                  onValueChange={handleOrganizationChange}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="选择机构" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleFormCancel}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '保存中...' : '保存'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
} 