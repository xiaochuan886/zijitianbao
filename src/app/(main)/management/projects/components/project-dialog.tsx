"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Plus, Trash2, Save, FileText, Folder, Tag } from "lucide-react"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { Badge } from "@/components/ui/badge"
import { Project } from "../page"

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project: Project | null
  onSubmit: (data: any) => Promise<void>
  onSuccess: () => void
}

interface SubProject {
  id?: string
  name: string
  fundTypeIds: string[]
  departmentIds: { [fundTypeId: string]: string[] }
  isNew?: boolean
  isDeleted?: boolean
}

interface Category {
  id: string
  name: string
  code?: string
}

interface FundType {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
  organizationId: string
  organization?: {
    name: string
  }
}

interface Organization {
  id: string
  name: string
}

export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSubmit,
  onSuccess,
}: ProjectDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    startYear: new Date().getFullYear(),
    categoryId: "",
    subProjects: [] as SubProject[]
  })
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [subProjectErrors, setSubProjectErrors] = useState<{ [key: number]: string }>({})

  // 用于下拉选择的数据
  const [categories, setCategories] = useState<Category[]>([])
  const [fundingTypes, setFundingTypes] = useState<FundType[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // 年份选项
  const currentYear = new Date().getFullYear()
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear + i)

  // 当对话框打开或项目数据变化时，更新表单
  useEffect(() => {
    if (open) {
      fetchOptions()
      
      if (project) {
        // 解析从API返回的项目数据，构建表单数据
        const subProjects = project.subProjects.map(sub => {
          // 从detailedFundNeeds中提取唯一的fundTypeIds
          const fundTypeIds = Array.from(new Set(
            sub.detailedFundNeeds.map(need => need.fundType.id)
          ));
          
          // 为每个资金类型创建对应的部门映射
          const departmentIds: { [fundTypeId: string]: string[] } = {};
          fundTypeIds.forEach(fundTypeId => {
            departmentIds[fundTypeId] = sub.detailedFundNeeds
              .filter(need => need.fundType.id === fundTypeId)
              .map(need => need.department.id);
          });
          
          return {
            id: sub.id,
            name: sub.name,
            fundTypeIds,
            departmentIds,
            isNew: false,
            isDeleted: false
          };
        });
        
        setFormData({
          name: project.name,
          code: project.code || "",
          startYear: project.startYear,
          categoryId: project.category?.id || "",
          subProjects
        });
      } else {
        // 新建项目时的默认值
        setFormData({
          name: "",
          code: "",
          startYear: currentYear,
          categoryId: "",
          subProjects: []
        })
      }
      
      // 清除错误
      setErrors({})
      setSubProjectErrors({})
    }
  }, [open, project])

  // 获取分类和资金需求类型选项
  const fetchOptions = async () => {
    try {
      setLoadingOptions(true)
      
      // 获取分类数据
      const categoriesResponse = await fetch('/api/project-categories')
      if (!categoriesResponse.ok) throw new Error('获取项目分类失败')
      const categoriesData = await categoriesResponse.json()
      const categoriesList = Array.isArray(categoriesData) ? 
        categoriesData : 
        (categoriesData.items || [])
      setCategories(categoriesList)
      
      // 获取资金需求类型
      const fundTypesResponse = await fetch('/api/funding-types')
      if (!fundTypesResponse.ok) throw new Error('获取资金需求类型失败')
      const fundTypesData = await fundTypesResponse.json()
      console.log('获取到的资金类型数据:', fundTypesData)
      
      // 处理资金类型数据
      let fundTypesList = []
      if (fundTypesData && fundTypesData.data && fundTypesData.data.items) {
        // API返回格式: { code: 200, message: '获取成功', data: { items: [...], meta: {...} } }
        fundTypesList = fundTypesData.data.items
      } else if (fundTypesData && Array.isArray(fundTypesData.items)) {
        // 可能的格式: { items: [...] }
        fundTypesList = fundTypesData.items
      } else if (Array.isArray(fundTypesData)) {
        // 可能的格式: [...]
        fundTypesList = fundTypesData
      }
      
      console.log('处理后的资金类型列表:', fundTypesList)
      setFundingTypes(fundTypesList)
      
      // 获取部门数据
      const departmentsResponse = await fetch('/api/departments')
      if (!departmentsResponse.ok) throw new Error('获取部门数据失败')
      const departmentsData = await departmentsResponse.json()
      console.log('获取到的部门数据:', departmentsData)
      
      // 处理部门数据
      const departmentsList = Array.isArray(departmentsData) ? 
        departmentsData : 
        (departmentsData.items || [])
      setDepartments(departmentsList)
      
      // 从部门数据中提取组织信息
      const uniqueOrganizations: Organization[] = []
      const organizationMap = new Map<string, boolean>()
      
      departmentsList.forEach((dept: Department) => {
        if (dept.organizationId && !organizationMap.has(dept.organizationId) && dept.organization) {
          organizationMap.set(dept.organizationId, true)
          uniqueOrganizations.push({
            id: dept.organizationId,
            name: dept.organization.name
          })
        }
      })
      
      setOrganizations(uniqueOrganizations)
    } catch (error) {
      console.error('获取选项数据失败:', error)
      toast.error('获取数据失败，请重试')
    } finally {
      setLoadingOptions(false)
    }
  }

  // 更新表单字段
  const handleInputChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value
    })
    
    // 清除对应字段的错误
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ""
      })
    }
  }
  
  // 添加子项目
  const handleAddSubProject = () => {
    setFormData({
      ...formData,
      subProjects: [
        ...formData.subProjects,
        {
          name: "",
          fundTypeIds: [],
          departmentIds: {},
          isNew: true,
          isDeleted: false
        }
      ]
    })
  }
  
  // 删除子项目
  const handleDeleteSubProject = (index: number) => {
    const updatedSubProjects = [...formData.subProjects]
    const subProject = updatedSubProjects[index]
    
    if (subProject.isNew) {
      // 如果是新添加的，直接从列表中移除
      updatedSubProjects.splice(index, 1)
    } else {
      // 如果是已有的，标记为删除
      updatedSubProjects[index] = { ...subProject, isDeleted: !subProject.isDeleted }
    }
    
    setFormData({
      ...formData,
      subProjects: updatedSubProjects
    })
    
    // 清除该子项目的错误
    if (subProjectErrors[index]) {
      const newErrors = { ...subProjectErrors }
      delete newErrors[index]
      setSubProjectErrors(newErrors)
    }
  }
  
  // 恢复删除的子项目
  const handleRestoreSubProject = (index: number) => {
    setFormData({
      ...formData,
      subProjects: formData.subProjects.map((subProject, i) =>
        i === index ? { ...subProject, isDeleted: false } : subProject
      )
    })
  }
  
  // 更新子项目名称
  const handleUpdateSubProjectName = (index: number, name: string) => {
    setFormData({
      ...formData,
      subProjects: formData.subProjects.map((subProject, i) =>
        i === index ? { ...subProject, name } : subProject
      )
    })
    
    // 清除子项目错误
    if (name.trim() && subProjectErrors[index]) {
      const newErrors = { ...subProjectErrors }
      delete newErrors[index]
      setSubProjectErrors(newErrors)
    }
  }
  
  // 更新子项目资金需求类型
  const handleUpdateSubProjectFundingTypes = (index: number, fundTypeIds: string[]) => {
    const subProjects = [...formData.subProjects];
    const subProject = subProjects[index];
    
    // 创建新的部门ID映射，只保留仍然存在的资金类型
    const newDepartmentIds: { [fundTypeId: string]: string[] } = {};
    fundTypeIds.forEach(fundTypeId => {
      newDepartmentIds[fundTypeId] = subProject.departmentIds[fundTypeId] || [];
    });
    
    subProjects[index] = {
      ...subProject,
      fundTypeIds,
      departmentIds: newDepartmentIds
    };
    
    setFormData({
      ...formData,
      subProjects
    });
  }
  
  // 更新子项目关联部门
  const handleUpdateSubProjectDepartments = (index: number, fundTypeId: string, departmentIds: string[]) => {
    const subProjects = [...formData.subProjects];
    const subProject = subProjects[index];
    
    subProjects[index] = {
      ...subProject,
      departmentIds: {
        ...subProject.departmentIds,
        [fundTypeId]: departmentIds
      }
    };
    
    setFormData({
      ...formData,
      subProjects
    });
  }
  
  // 表单验证
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    const newSubProjectErrors: { [key: number]: string } = {}
    let isValid = true
    
    // 验证基本信息
    if (!formData.name.trim()) {
      newErrors.name = "项目名称不能为空"
      isValid = false
    }
    
    if (!formData.code.trim()) {
      newErrors.code = "项目编码不能为空"
      isValid = false
    }
    
    // 验证子项目
    formData.subProjects.forEach((subProject, index) => {
      if (!subProject.isDeleted) {
        if (!subProject.name.trim()) {
          newSubProjectErrors[index] = "子项目名称不能为空"
          isValid = false
        }
        
        if (subProject.fundTypeIds.length === 0) {
          if (!newSubProjectErrors[index]) {
            newSubProjectErrors[index] = "请选择至少一个资金需求类型"
          }
          isValid = false
        }
        
        // 检查每个资金类型是否至少有一个关联部门
        let hasDepartment = false;
        for (const fundTypeId of subProject.fundTypeIds) {
          if (subProject.departmentIds[fundTypeId]?.length > 0) {
            hasDepartment = true;
            break;
          }
        }
        
        if (!hasDepartment) {
          if (!newSubProjectErrors[index]) {
            newSubProjectErrors[index] = "请为至少一个资金需求类型选择关联部门"
          }
          isValid = false
        }
      }
    })
    
    setErrors(newErrors)
    setSubProjectErrors(newSubProjectErrors)
    
    return isValid
  }
  
  // 处理表单提交
  const handleSubmit = async () => {
    if (!validateForm()) return
    
    try {
      setIsSubmitting(true)
      
      // 准备提交数据
      const activeSubProjects = formData.subProjects.filter(
        subProject => !subProject.isDeleted
      )
      
      // 构建提交数据
      const submitData = {
        name: formData.name,
        code: formData.code,
        startYear: formData.startYear,
        categoryId: formData.categoryId || null,
        subProjects: activeSubProjects.map(subProject => {
          // 为每个子项目创建detailedFundNeeds数组
          const detailedFundNeeds = [];
          
          // 为每个资金类型和部门的组合创建一个detailedFundNeed
          for (const fundTypeId of subProject.fundTypeIds) {
            const departmentIds = subProject.departmentIds[fundTypeId] || [];
            
            for (const departmentId of departmentIds) {
              // 获取部门关联的组织ID
              const department = departments.find(d => d.id === departmentId);
              const organizationId = department?.organizationId;
              
              if (!organizationId) {
                throw new Error(`未找到部门 ${departmentId} 的组织信息`);
              }
              
              detailedFundNeeds.push({
                fundTypeId,
                departmentId,
                organizationId
              });
            }
          }
          
          return {
            id: subProject.id,
            name: subProject.name,
            detailedFundNeeds
          };
        })
      }
      
      // 发送请求
      const response = await fetch(
        project ? `/api/projects/${project.id}` : '/api/projects',
        {
          method: project ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(submitData)
        }
      )
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || '提交失败')
      }
      
      // 成功处理
      toast.success(project ? '项目更新成功' : '项目创建成功')
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error('提交失败:', error)
      toast.error(error instanceof Error ? error.message : '提交失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // 当前有效子项目数量
  const activeSubProjectCount = formData.subProjects.filter(sp => !sp.isDeleted).length
  // 当前删除的子项目数量 
  const deletedSubProjectCount = formData.subProjects.filter(sp => sp.isDeleted && !sp.isNew).length

  return (
    <Dialog open={open} onOpenChange={isSubmitting ? undefined : onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <DialogTitle>{project ? "编辑项目" : "新增项目"}</DialogTitle>
          </div>
          <DialogDescription className="flex items-center gap-2">
            <div>{project ? "修改项目信息和关联的子项目" : "创建新项目和关联的子项目"}</div>
            {formData.subProjects.length > 0 && (
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{activeSubProjectCount} 个子项目</Badge>
                {deletedSubProjectCount > 0 && (
                  <Badge variant="destructive">{deletedSubProjectCount} 个待删除</Badge>
                )}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] pr-4 overflow-y-auto">
          <div className="space-y-6 py-2">
            {/* 基本信息区域 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">基本信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    项目名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="输入项目名称"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="code">
                    项目编码 <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange("code", e.target.value)}
                    placeholder="输入项目编码"
                    className={errors.code ? "border-red-500" : ""}
                  />
                  {errors.code && <p className="text-red-500 text-xs">{errors.code}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startYear">
                    开始年份 <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.startYear.toString()}
                    onValueChange={(value) => handleInputChange("startYear", parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择开始年份" />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="category">项目分类</Label>
                  <Select
                    value={formData.categoryId || undefined}
                    onValueChange={(value) => handleInputChange('categoryId', value)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择项目分类" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">未分类</SelectItem>
                      {loadingOptions ? (
                        <div className="flex items-center justify-center py-2">
                          <Spinner className="h-4 w-4" />
                          <span className="ml-2">加载中...</span>
                        </div>
                      ) : (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            {/* 子项目区域 */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">子项目信息</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleAddSubProject}
                  disabled={isSubmitting}
                >
                  <Plus className="h-4 w-4 mr-1" /> 添加子项目
                </Button>
              </div>
              
              <div className="space-y-2">
                {formData.subProjects.length === 0 ? (
                  <div className="text-center py-6 border rounded-md border-dashed">
                    <Folder className="mx-auto h-8 w-8 text-muted-foreground opacity-50" />
                    <p className="mt-2 text-sm text-muted-foreground">
                      暂无子项目，点击"添加子项目"按钮开始添加
                    </p>
                  </div>
                ) : (
                  formData.subProjects.map((subProject, index) => (
                    <div key={subProject.id || `new-${index}`}>
                      {subProject.isDeleted ? (
                        <Card className="p-3 flex items-center justify-between bg-muted/50 border-dashed">
                          <div className="flex items-center">
                            <Trash2 className="h-4 w-4 text-muted-foreground mr-2" />
                            <span className="line-through text-muted-foreground">{subProject.name}</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRestoreSubProject(index)}
                          >
                            恢复
                          </Button>
                        </Card>
                      ) : (
                        <Card className="p-4">
                          <div className="space-y-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 space-y-1">
                                <Label htmlFor={`subProject-${index}`}>
                                  子项目名称 <span className="text-red-500">*</span>
                                </Label>
                                <div className="flex gap-2">
                                  <Input
                                    id={`subProject-${index}`}
                                    value={subProject.name}
                                    onChange={(e) => handleUpdateSubProjectName(index, e.target.value)}
                                    placeholder="输入子项目名称"
                                    className={subProjectErrors[index] ? "border-red-500" : ""}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeleteSubProject(index)}
                                    className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-950/30"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                                {subProjectErrors[index] && <p className="text-red-500 text-xs">{subProjectErrors[index]}</p>}
                              </div>
                            </div>
                            
                            <div className="space-y-1">
                              <Label>关联资金需求类型</Label>
                              <div className="relative">
                                <Select
                                  value="multiple"
                                  onValueChange={(value) => {
                                    // 如果值不是"multiple"，表示用户选择了单一选项
                                    if (value !== "multiple") {
                                      const fundingTypeIds = [...subProject.fundTypeIds]
                                      
                                      // 切换选中状态
                                      if (fundingTypeIds.includes(value)) {
                                        handleUpdateSubProjectFundingTypes(
                                          index,
                                          fundingTypeIds.filter(id => id !== value)
                                        )
                                      } else {
                                        handleUpdateSubProjectFundingTypes(
                                          index,
                                          [...fundingTypeIds, value]
                                        )
                                      }
                                    }
                                  }}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="选择资金需求类型">
                                      已选择 {subProject.fundTypeIds.length} 个资金需求类型
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {loadingOptions ? (
                                      <div className="flex items-center justify-center py-2">
                                        <Spinner className="h-4 w-4" />
                                        <span className="ml-2">加载中...</span>
                                      </div>
                                    ) : (
                                      fundingTypes.map((fundType) => (
                                        <SelectItem 
                                          key={fundType.id} 
                                          value={fundType.id}
                                          className="flex items-center gap-2"
                                        >
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={subProject.fundTypeIds.includes(fundType.id)}
                                              className="h-4 w-4"
                                              onChange={() => {}} // 需要这个空函数以避免React警告
                                            />
                                            <Tag className="h-3 w-3 text-primary" />
                                            {fundType.name}
                                          </div>
                                        </SelectItem>
                                      ))
                                    )}
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {subProject.fundTypeIds.length > 0 ? (
                                  fundingTypes
                                    .filter(ft => subProject.fundTypeIds.includes(ft.id))
                                    .map(fundType => (
                                      <Badge 
                                        key={fundType.id} 
                                        variant="outline" 
                                        className="bg-blue-50 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
                                      >
                                        {fundType.name}
                                      </Badge>
                                    ))
                                ) : (
                                  <span className="text-xs text-muted-foreground">
                                    未选择资金需求类型
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* 资金类型对应的部门选择 */}
                            {subProject.fundTypeIds.length > 0 && (
                              <div className="space-y-4 mt-4">
                                <Label>关联部门</Label>
                                
                                {subProject.fundTypeIds.map(fundTypeId => {
                                  const fundType = fundingTypes.find(ft => ft.id === fundTypeId);
                                  if (!fundType) return null;
                                  
                                  return (
                                    <div key={fundTypeId} className="space-y-2 border p-3 rounded-md">
                                      <div className="flex items-center gap-2">
                                        <Badge 
                                          variant="outline" 
                                          className="bg-blue-50 dark:bg-blue-950 dark:text-blue-200 dark:border-blue-800"
                                        >
                                          {fundType.name}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">的关联部门</span>
                                      </div>
                                      
                                      <div className="relative">
                                        <Select
                                          value="multiple"
                                          onValueChange={(value) => {
                                            // 如果值不是"multiple"，表示用户选择了单一选项
                                            if (value !== "multiple") {
                                              const departmentIds = subProject.departmentIds[fundTypeId] || [];
                                              
                                              // 切换选中状态
                                              if (departmentIds.includes(value)) {
                                                handleUpdateSubProjectDepartments(
                                                  index,
                                                  fundTypeId,
                                                  departmentIds.filter(id => id !== value)
                                                )
                                              } else {
                                                handleUpdateSubProjectDepartments(
                                                  index,
                                                  fundTypeId,
                                                  [...departmentIds, value]
                                                )
                                              }
                                            }
                                          }}
                                        >
                                          <SelectTrigger>
                                            <SelectValue placeholder="选择关联部门">
                                              已选择 {subProject.departmentIds[fundTypeId]?.length || 0} 个部门
                                            </SelectValue>
                                          </SelectTrigger>
                                          <SelectContent>
                                            {loadingOptions ? (
                                              <div className="flex items-center justify-center py-2">
                                                <Spinner className="h-4 w-4" />
                                                <span className="ml-2">加载中...</span>
                                              </div>
                                            ) : (
                                              departments.map((department) => {
                                                // 查找部门所属的组织
                                                const organization = organizations.find(
                                                  org => org.id === department.organizationId
                                                );
                                                
                                                return (
                                                  <SelectItem 
                                                    key={department.id} 
                                                    value={department.id}
                                                    className="flex items-center gap-2"
                                                  >
                                                    <div className="flex items-center gap-2">
                                                      <input
                                                        type="checkbox"
                                                        checked={(subProject.departmentIds[fundTypeId] || []).includes(department.id)}
                                                        className="h-4 w-4"
                                                        onChange={() => {}} // 需要这个空函数以避免React警告
                                                      />
                                                      <span>
                                                        {organization ? `${organization.name}: ` : ''}
                                                        {department.name}
                                                      </span>
                                                    </div>
                                                  </SelectItem>
                                                );
                                              })
                                            )}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        {(subProject.departmentIds[fundTypeId]?.length || 0) > 0 ? (
                                          departments
                                            .filter(dept => (subProject.departmentIds[fundTypeId] || []).includes(dept.id))
                                            .map(department => {
                                              // 查找部门所属的组织
                                              const organization = organizations.find(
                                                org => org.id === department.organizationId
                                              );
                                              
                                              return (
                                                <Badge 
                                                  key={department.id} 
                                                  variant="outline" 
                                                  className="bg-green-50 dark:bg-green-950 dark:text-green-200 dark:border-green-800"
                                                >
                                                  {organization ? `${organization.name}: ` : ''}
                                                  {department.name}
                                                </Badge>
                                              );
                                            })
                                        ) : (
                                          <span className="text-xs text-muted-foreground">
                                            未选择关联部门
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <DialogFooter className="flex gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                保存中...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                保存项目
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 