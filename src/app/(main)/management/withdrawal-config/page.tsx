"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner"
import { Undo2, Save } from "lucide-react"
import { extendedApiClient } from "@/lib/api-client-extended"
import { CheckboxGroup } from "@/components/ui/checkbox-group"

// 模块类型定义
const moduleTypes = [
  { id: "predict", label: "资金预测填报" },
  { id: "actual_user", label: "实际使用填报" },
  { id: "actual_fin", label: "财务填报" },
  { id: "audit", label: "审计填报" }
]

// 状态选项
const statusOptions = {
  predict: [
    { value: "draft", label: "草稿" },
    { value: "submitted", label: "已提交" },
    { value: "approved", label: "已批准" },
    { value: "rejected", label: "已拒绝" },
    { value: "pending_withdrawal", label: "待撤回" },
    { value: "withdrawn", label: "已撤回" }
  ],
  actual_user: [
    { value: "draft", label: "草稿" },
    { value: "submitted", label: "已提交" },
    { value: "approved", label: "已批准" },
    { value: "rejected", label: "已拒绝" },
    { value: "pending_withdrawal", label: "待撤回" },
    { value: "withdrawn", label: "已撤回" }
  ],
  actual_fin: [
    { value: "draft", label: "草稿" },
    { value: "submitted", label: "已提交" },
    { value: "approved", label: "已批准" },
    { value: "rejected", label: "已拒绝" },
    { value: "pending_withdrawal", label: "待撤回" },
    { value: "withdrawn", label: "已撤回" }
  ],
  audit: [
    { value: "draft", label: "草稿" },
    { value: "submitted", label: "已提交" },
    { value: "approved", label: "已批准" },
    { value: "rejected", label: "已拒绝" },
    { value: "pending_withdrawal", label: "待撤回" },
    { value: "withdrawn", label: "已撤回" }
  ]
}

// 撤回配置接口
interface WithdrawalConfig {
  id?: string
  moduleType: string
  allowedStatuses: string[]
  timeLimit: number
  maxAttempts: number
  requireApproval: boolean
}

// API 响应接口
interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export default function WithdrawalConfigPage() {
  const [activeTab, setActiveTab] = useState("predict")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [configs, setConfigs] = useState<Record<string, WithdrawalConfig>>({})

  // 加载配置
  useEffect(() => {
    const fetchConfigs = async () => {
      setLoading(true)
      try {
        const response = await extendedApiClient.withdrawalConfig.list() as { data: ApiResponse<WithdrawalConfig[]> }
        if (response.data && response.data.data) {
          const configsMap: Record<string, WithdrawalConfig> = {}
          
          response.data.data.forEach((config: WithdrawalConfig) => {
            // 将JSON字符串转换为数组
            const parsedConfig = {
              ...config,
              allowedStatuses: typeof config.allowedStatuses === 'string' 
                ? JSON.parse(config.allowedStatuses as string) 
                : config.allowedStatuses
            }
            configsMap[config.moduleType] = parsedConfig
          })
          
          // 为没有配置的模块设置默认值
          moduleTypes.forEach(module => {
            if (!configsMap[module.id]) {
              configsMap[module.id] = {
                moduleType: module.id,
                allowedStatuses: ["draft"],
                timeLimit: 24,
                maxAttempts: 3,
                requireApproval: true
              }
            }
          })
          
          setConfigs(configsMap)
        }
      } catch (error) {
        console.error("Failed to fetch withdrawal configs:", error)
        toast.error("加载撤回配置失败")
        
        // 设置默认配置
        const defaultConfigs: Record<string, WithdrawalConfig> = {}
        moduleTypes.forEach(module => {
          defaultConfigs[module.id] = {
            moduleType: module.id,
            allowedStatuses: ["draft"],
            timeLimit: 24,
            maxAttempts: 3,
            requireApproval: true
          }
        })
        setConfigs(defaultConfigs)
      } finally {
        setLoading(false)
      }
    }

    fetchConfigs()
  }, [])

  // 保存配置
  const handleSave = async () => {
    setSaving(true);
    try {
      // 获取当前选中的模块和配置
      const moduleType = activeTab;
      console.log("当前activeTab:", moduleType);
      
      // 获取当前模块的配置
      const currentConfig = configs[moduleType];
      console.log("当前配置对象:", currentConfig);
      
      if (!moduleType || !currentConfig) {
        toast.error("找不到当前模块配置");
        return;
      }
      
      // 创建普通对象，确保所有字段都有值
      const data = {
        moduleType: moduleType,
        id: currentConfig.id || undefined,
        allowedStatuses: JSON.stringify(currentConfig.allowedStatuses || []),
        timeLimit: currentConfig.timeLimit || 24,
        maxAttempts: currentConfig.maxAttempts || 3,
        requireApproval: currentConfig.requireApproval
      };
      
      console.log("准备发送的数据:", data);
      
      // 将对象转换为URLSearchParams (类似表单提交)
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });
      
      // 打印最终发送的表单数据
      console.log("最终URL编码的表单数据:");
      console.log(params.toString());
      
      try {
        // 使用表单数据格式发送请求
        const response = await fetch('/api/withdrawal-config', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params,
        });
        
        const responseData = await response.json();
        console.log("服务器响应:", responseData);
        
        if (!response.ok) {
          throw new Error(`保存失败: ${responseData.message || '未知错误'}`);
        }
        
        toast.success("撤回配置保存成功");
      } catch (error) {
        console.error("保存请求失败:", error);
        toast.error(`保存撤回配置失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    } catch (error) {
      console.error("执行保存操作失败:", error);
      toast.error("保存撤回配置失败");
    } finally {
      setSaving(false);
    }
  };

  // 更新配置字段
  const updateConfig = (field: keyof WithdrawalConfig, value: any) => {
    console.log(`更新配置字段 - 模块:${activeTab}, 字段:${field}, 值:`, value);
    
    setConfigs(prev => {
      // 确保当前模块配置存在
      const currentConfig = prev[activeTab] || {
        moduleType: activeTab,
        allowedStatuses: [],
        timeLimit: 24,
        maxAttempts: 3,
        requireApproval: true
      };
      
      // 创建更新后的配置
      const updatedConfig = {
        ...currentConfig,
        [field]: value
      };
      
      console.log(`更新后的${activeTab}模块配置:`, updatedConfig);
      
      // 返回更新后的状态
      return {
        ...prev,
        [activeTab]: updatedConfig
      };
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">撤回功能配置</h1>
          <p className="text-muted-foreground">管理各模块的撤回功能参数设置</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
          保存配置
        </Button>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          {moduleTypes.map(module => (
            <TabsTrigger key={module.id} value={module.id}>
              {module.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {moduleTypes.map(module => (
          <TabsContent key={module.id} value={module.id}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Undo2 className="mr-2 h-5 w-5" />
                  {module.label}撤回配置
                </CardTitle>
                <CardDescription>
                  配置{module.label}模块的撤回功能参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label htmlFor={`allowed-statuses-${module.id}`}>允许撤回的状态</Label>
                  <CheckboxGroup
                    id={`allowed-statuses-${module.id}`}
                    options={statusOptions[module.id as keyof typeof statusOptions]}
                    selected={configs[module.id]?.allowedStatuses || []}
                    onChange={(selected) => {
                      console.log(`${module.id}模块的状态选择变更:`, selected);
                      updateConfig('allowedStatuses', selected);
                    }}
                    className="mt-2 border rounded-md p-4"
                  />
                  <p className="text-sm text-muted-foreground">
                    选择哪些状态下允许用户申请撤回
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`time-limit-${module.id}`}>撤回时间限制(小时)</Label>
                  <Input
                    id={`time-limit-${module.id}`}
                    type="number"
                    min={1}
                    value={configs[module.id]?.timeLimit || 24}
                    onChange={e => updateConfig('timeLimit', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    提交后多长时间内允许申请撤回
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor={`max-attempts-${module.id}`}>最大撤回次数</Label>
                  <Input
                    id={`max-attempts-${module.id}`}
                    type="number"
                    min={1}
                    value={configs[module.id]?.maxAttempts || 3}
                    onChange={e => updateConfig('maxAttempts', parseInt(e.target.value))}
                  />
                  <p className="text-sm text-muted-foreground">
                    每条记录最多允许撤回的次数
                  </p>
                </div>
                
                <div className="flex items-start space-x-3 pt-2">
                  <Checkbox
                    id={`require-approval-${module.id}`}
                    checked={configs[module.id]?.requireApproval}
                    onCheckedChange={checked => updateConfig('requireApproval', !!checked)}
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor={`require-approval-${module.id}`}>需要管理员审批</Label>
                    <p className="text-sm text-muted-foreground">
                      撤回请求是否需要管理员审批
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}