'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/data-table';
import { Plus } from 'lucide-react';
import { ProjectForm } from './components/project-form';
import { useToast } from '@/hooks/use-toast';

interface Project {
  id: string;
  name: string;
  code: string;
  status: 'active' | 'archived';
  startYear: number;
  createdAt: Date;
}

interface RowType {
  original: {
    id: string;
    status: string;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('获取到的项目数据:', data);
      
      // 检查响应数据格式，正确处理分页数据
      if (data && data.items) {
        setProjects(data.items);
      } else if (Array.isArray(data)) {
        setProjects(data);
      } else {
        console.error('项目数据格式不正确:', data);
        setProjects([]);
      }
    } catch (error) {
      console.error('获取项目列表失败:', error);
      toast({
        variant: 'destructive',
        title: '错误',
        description: '获取项目列表失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      accessorKey: 'name',
      header: '项目名称',
    },
    {
      accessorKey: 'code',
      header: '项目编码',
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }: { row: RowType }) => (
        <span className={`px-2 py-1 rounded text-sm ${
          row.original.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {row.original.status === 'ACTIVE' ? '活跃' : '已归档'}
        </span>
      ),
    },
    {
      accessorKey: 'startYear',
      header: '开始年份',
    },
    {
      accessorKey: 'actions',
      header: '操作',
      cell: ({ row }: { row: RowType }) => (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => handleEdit(row.original.id)}>
            编辑
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleArchive(row.original.id)}>
            {row.original.status === 'ACTIVE' ? '归档' : '激活'}
          </Button>
        </div>
      ),
    },
  ];

  const handleEdit = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      setEditingProject(project);
      setShowForm(true);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/projects/${id}/archive`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('归档失败');
      
      toast({
        title: '成功',
        description: '项目状态已更新'
      });
      
      await fetchProjects();
    } catch (error) {
      console.error('更新项目状态失败:', error);
      toast({
        variant: 'destructive',
        title: '错误',
        description: '更新项目状态失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingProject(null);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData: any) => {
    try {
      setLoading(true);
      console.log('原始表单数据:', formData);
      
      // 转换数据格式以匹配API期望的格式
      const apiData = {
        name: formData.name,
        code: formData.code,
        status: 'ACTIVE', // 新项目默认为活跃状态，使用枚举值
        startYear: formData.startYear,
        organizationIds: formData.departments.map((d: any) => d.organizationId),
        departmentIds: formData.departments.flatMap((d: any) => d.departmentIds),
        subProjects: formData.subProjects.map((s: any) => ({
          name: s.name,
          fundTypeIds: s.fundingTypes
        }))
      };
      
      console.log('转换后的API数据:', apiData);
      
      const url = editingProject ? `/api/projects/${editingProject.id}` : '/api/projects';
      const method = editingProject ? 'PUT' : 'POST';
      const token = localStorage.getItem('token');
      
      console.log('发送请求到:', url, '方法:', method);
      
      try {
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(apiData)
        });
        
        console.log('响应状态:', response.status);
        const responseText = await response.text();
        console.log('响应文本:', responseText);
        
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          console.error('解析响应JSON失败:', e);
          responseData = { message: '服务器响应格式错误' };
        }
        
        console.log('响应数据:', responseData);
        
        if (!response.ok) {
          throw new Error(responseData.message || '保存失败');
        }
        
        toast({
          title: '成功',
          description: `项目已${editingProject ? '更新' : '创建'}`
        });
        
        setShowForm(false);
        await fetchProjects();
      } catch (fetchError: any) {
        console.error('请求错误:', fetchError);
        throw fetchError;
      }
    } catch (error: any) {
      console.error('保存项目失败:', error);
      toast({
        variant: 'destructive',
        title: '错误',
        description: error.message || '保存项目失败，请稍后重试'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingProject(null);
  };

  return (
    <div className="container mx-auto py-6">
      {showForm ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-semibold">{editingProject ? '编辑项目' : '新增项目'}</h1>
          </div>
          <ProjectForm
            initialData={editingProject as any}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">项目管理</h1>
            <Button onClick={handleCreate}>
              <Plus className="w-4 h-4 mr-2" />
              新增项目
            </Button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <p>加载中...</p>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={projects}
            />
          )}
        </>
      )}
    </div>
  );
}