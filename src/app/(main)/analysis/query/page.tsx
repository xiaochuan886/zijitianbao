"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import {
  DndContext, 
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy
} from "@dnd-kit/core"
import {
  restrictToWindowEdges,
  restrictToVerticalAxis,
  restrictToHorizontalAxis,
} from "@dnd-kit/modifiers"
import { 
  SortableContext, 
  horizontalListSortingStrategy, 
  verticalListSortingStrategy,
  useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts"
// @ts-ignore
import { CSVLink } from "react-csv"
import {
  X, 
  Plus,
  Filter,
  ChevronDown,
  Check,
  Undo2,
  RefreshCw,
  BarChart3,
  LineChart as LineChartIcon,
  BarChart4,
  PieChart as PieChartIcon,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  GripHorizontal,
  GripVertical,
  Download,
  Sparkles,
  ChevronsUpDown,
  Menu
} from "lucide-react"

// 数据维度和指标定义
type Dimension = {
  id: string
  name: string
  fieldName: string
  type: "dimension"
}

type Metric = {
  id: string
  name: string
  fieldName: string
  type: "metric"
  calculation?: (data: any[]) => number
}

type Item = Dimension | Metric

// 行列区域定义
type Zone = "rows" | "columns" | "values" | "filters" | "unassigned"

// 数据类型
type ReportData = {
  id: string
  orgId: string
  orgName: string
  orgCode: string
  departmentId: string
  departmentName: string
  departmentCode: string
  projectCategoryId: string
  projectCategoryName: string
  projectId: string
  projectName: string
  projectCode: string
  subProjectId: string
  subProjectName: string
  subProjectCode: string
  fundTypeId: string
  fundTypeName: string
  year: number
  month: number
  submittedDate: string
  predictAmount: number
  actualAmount: number
  executionRate: number
  yoyChange: number
  momChange: number
  [key: string]: string | number // 添加索引签名
}

// 透视表数据类型
type PivotRowItem = {
  field: string
  value: string | number
}

type PivotHeader = {
  key: string
  label: string
  items: PivotRowItem[]
}

type PivotRow = {
  key: string
  label: string
  items: PivotRowItem[]
  values: Record<string, number>
}

type PivotTable = {
  headers: PivotHeader[]
  rows: PivotRow[]
  valueFields?: string[]
}

// 过滤器类型
type FilterConfig = {
  itemId: string;
  operator: 'equals' | 'contains' | 'greaterThan' | 'lessThan' | 'between';
  value: string | number | string[] | [number, number];
  enabled: boolean;
}

// 排序类型定义
type SortConfig = {
  fieldId: string;  // 字段ID
  direction: 'asc' | 'desc';  // 排序方向
}

// 安全数组操作辅助函数
const safeFilter = <T,>(arr: T[] | null | undefined): T[] => {
  if (!arr) return [];
  return arr.filter(Boolean);
};

const safeMap = <T, R>(arr: T[] | null | undefined, mapper: (item: T) => R): R[] => {
  if (!arr) return [];
  return arr.filter(Boolean).map(mapper);
};

// 过滤器组件
function FilterItem({ 
  item, 
  onUpdate,
  onRemove,
  data
}: { 
  item: Item, 
  onUpdate: (config: FilterConfig) => void,
  onRemove: (item: Item) => void,
  data?: ReportData[]
}) {
  // 当前过滤器配置
  const [config, setConfig] = useState<FilterConfig>({
    itemId: item.id,
    operator: item.type === 'dimension' ? 'equals' : 'greaterThan',
    value: item.type === 'dimension' ? [] as string[] : 0,
    enabled: true
  });
  
  // 更新过滤器并通知父组件
  const updateFilter = (newConfig: Partial<FilterConfig>) => {
    const updated = { ...config, ...newConfig };
    setConfig(updated);
    onUpdate(updated);
  };
  
  // 操作符选项
  const operatorOptions = useMemo(() => {
    if (item.type === 'dimension') {
      return [
        { value: 'equals', label: '等于' }
      ];
    } else {
      return [
        { value: 'equals', label: '等于' },
        { value: 'greaterThan', label: '大于' },
        { value: 'lessThan', label: '小于' },
        { value: 'between', label: '范围' }
      ];
    }
  }, [item.type]);
  
  // 处理输入值的变化（针对数值型字段）
  const handleValueChange = (value: string) => {
    if (item.type !== 'dimension') {
      // 数值类型
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        updateFilter({ value: numValue });
      }
    }
  };
  
  // 处理范围输入的变化
  const handleRangeChange = (index: number, value: string) => {
    if (config.operator !== 'between') return;
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    const rangeValues = Array.isArray(config.value) && config.value.length === 2
      ? [...config.value] 
      : [0, 0];
    
    rangeValues[index] = numValue;
    updateFilter({ value: rangeValues as [number, number] });
  };
  
  // 处理多选值的添加
  const handleMultiSelectChange = (selectedValues: string[]) => {
    updateFilter({ value: selectedValues });
  };
  
  // 从多选值中移除某一项
  const removeSelectedValue = (valueToRemove: string) => {
    if (Array.isArray(config.value)) {
      const newValues = (config.value as string[]).filter(v => v !== valueToRemove);
      updateFilter({ value: newValues });
    }
  };
  
  // 获取字段的所有可能值，用于下拉选择
  const availableValues = useMemo(() => {
    if (!data || !item || item.type !== 'dimension') return [];
    
    // 获取字段的所有唯一值
    const uniqueValues = new Set<string>();
    data.forEach(record => {
      if (record[item.fieldName] !== undefined) {
        uniqueValues.add(record[item.fieldName].toString());
      }
    });
    
    return Array.from(uniqueValues).sort((a, b) => {
      return a.localeCompare(b);
    });
  }, [data, item]);
  
  // 检查是否为多选配置（仅维度字段且操作符为equals或contains）
  const isMultiSelect = item.type === 'dimension' && 
    (config.operator === 'equals' || config.operator === 'contains');
  
  // 当前选中的值的数组
  const selectedValues = isMultiSelect && Array.isArray(config.value) 
    ? config.value as string[]
    : [];

  return (
    <div className="border rounded-md p-3 bg-white shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${item.type === 'dimension' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          <span className="font-medium">{item.name}</span>
      </div>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove(item);
          }}
          className="text-gray-400 hover:text-red-500"
          title="移除过滤器"
        >
          <X size={14} />
        </button>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Switch 
            checked={config.enabled} 
            onCheckedChange={(checked) => updateFilter({ enabled: checked })}
          />
          <Label htmlFor={`filter-${item.id}-enabled`} className="text-xs">
            {config.enabled ? '已启用' : '已禁用'}
          </Label>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <Select
            value={config.operator}
            onValueChange={(value) => {
              const newOperator = value as FilterConfig['operator'];
              let newValue: FilterConfig['value'];
              
              if (newOperator === 'between') {
                newValue = [0, 0] as [number, number];
              } else if (item.type === 'dimension') {
                newValue = [] as string[]; // 明确类型
              } else {
                newValue = 0;
              }
              
              updateFilter({ operator: newOperator, value: newValue });
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="选择条件" />
            </SelectTrigger>
            <SelectContent>
              {operatorOptions.map(option => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {config.operator === 'between' ? (
            <div className="flex space-x-1">
        <Input
                type="text"
                className="h-8 text-xs flex-1"
                placeholder="最小值"
                value={Array.isArray(config.value) && config.value.length === 2 ? config.value[0] : 0}
                onChange={(e) => handleRangeChange(0, e.target.value)}
              />
              <Input
                type="text"
                className="h-8 text-xs flex-1"
                placeholder="最大值"
                value={Array.isArray(config.value) && config.value.length === 2 ? config.value[1] : 0}
                onChange={(e) => handleRangeChange(1, e.target.value)}
        />
      </div>
          ) : isMultiSelect ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-1">
                <div className="relative flex-1">
                  <select 
                    className="w-full h-8 rounded-md border border-input bg-background px-3 py-1 text-xs ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value && !selectedValues.includes(value)) {
                        handleMultiSelectChange([...selectedValues, value]);
                      }
                      // 重置选择框
                      e.target.value = "";
                    }}
                  >
                    <option value="">选择值</option>
                    {availableValues
                      .filter(value => !selectedValues.includes(value))
                      .map(value => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                  </select>
                </div>
                {availableValues.length > 0 && (
                  <button 
                    onClick={() => handleMultiSelectChange([...selectedValues, ...availableValues.filter(v => !selectedValues.includes(v))])}
                    className="flex items-center justify-center h-8 px-2 border rounded-md hover:bg-gray-100"
                    title="全选"
                  >
                    <Plus size={14} />
                  </button>
                )}
              </div>
              
              {selectedValues.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedValues.map(value => (
                    <Badge key={value} variant="secondary" className="text-xs py-0 px-1">
                      {value}
                      <button 
                        className="ml-1 hover:text-red-500"
                        onClick={() => removeSelectedValue(value)}
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <Input
              type={item.type === 'dimension' ? 'text' : 'number'}
              className="h-8 text-xs"
              placeholder="输入值"
              value={!Array.isArray(config.value) ? config.value?.toString() || '' : ''}
              onChange={(e) => handleValueChange(e.target.value)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// 字段拖拽项组件
function DraggableItem({ 
  item, 
  zone, 
  onRemove 
}: { 
  item: Item, 
  zone: Zone,
  onRemove?: (item: Item) => void
}) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging,
    active
  } = useSortable({
    id: item.id,
    data: {
      item,
      zone
    }
  })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
    cursor: 'grab' as const, 
    touchAction: 'none' as const,
    userSelect: 'none' as const
  }
  
  // 根据不同的字段类型使用不同的样式
  const getBgColor = () => {
    if (isDragging) return 'bg-muted'
    if (item.type === 'dimension') return 'bg-blue-50 hover:bg-blue-100'
    return 'bg-green-50 hover:bg-green-100'
  }
  
  const getIcon = () => {
    if (item.type === 'dimension') {
      return zone === "rows" || zone === "unassigned" 
        ? <GripVertical size={16} className="text-blue-500" /> 
        : <GripHorizontal size={16} className="text-blue-500" />
    } else {
      return zone === "rows" || zone === "unassigned" 
        ? <GripVertical size={16} className="text-green-500" /> 
        : <GripHorizontal size={16} className="text-green-500" />
    }
  }
  
  // 只在非未分配区域显示移除按钮
  const showRemoveButton = zone !== 'unassigned' && onRemove;
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded-md border 
                ${getBgColor()}
                cursor-grab transition-colors shadow-sm group relative select-none drag-item`}
      {...attributes}
      {...listeners}
      data-zone={zone}
      data-item-id={item.id}
      data-type={item.type}
    >
      {getIcon()}
      <span className="font-medium text-sm pointer-events-none">{item.name}</span>
      <span className="text-xs text-muted-foreground ml-auto pointer-events-none">
        {item.type === 'dimension' ? '维度' : '指标'}
      </span>
      
      {/* 移除按钮 */}
      {showRemoveButton && (
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onRemove?.(item);
          }}
          className="absolute -right-2 -top-2 rounded-full bg-white border shadow-sm h-5 w-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 z-20"
          title="移除"
        >
          <X size={12} className="text-gray-500 hover:text-red-500" />
        </button>
      )}
    </div>
  )
}

// 字段区域组件
function ItemZone({ 
  title, 
  items, 
  zone,
  onRemoveItem
}: { 
  title: string, 
  items: Item[], 
  zone: Zone,
  onRemoveItem?: (item: Item) => void
}) {
  // 区域样式根据类型不同，增加活跃状态样式
  const getZoneStyle = () => {
    switch(zone) {
      case 'rows':
        return 'bg-blue-50/50 border-blue-200 hover:bg-blue-100/50'
      case 'columns':
        return 'bg-indigo-50/50 border-indigo-200 hover:bg-indigo-100/50'
      case 'values':
        return 'bg-green-50/50 border-green-200 hover:bg-green-100/50'
      case 'filters':
        return 'bg-amber-50/50 border-amber-200 hover:bg-amber-100/50'
      default:
        return 'bg-gray-50/50 border-gray-200 hover:bg-gray-100/50'
    }
  }

  // 使用droppable设置整个区域为可放置区域
  const { setNodeRef, active, isOver } = useDroppable({
    id: `zone-${zone}`,
    data: {
      zone,
      accepts: 'item'
    }
  });
  
  // 当拖拽项悬停在区域上时增加明显的视觉效果
  const zoneClasses = `
    border rounded-md p-2 flex-1 min-h-24 
    ${getZoneStyle()} 
    transition-colors
    ${isOver ? 'ring-2 ring-primary ring-offset-2' : ''}
  `;
  
  return (
    <div 
      ref={setNodeRef}
      className={zoneClasses}
      data-zone={zone}
      id={`zone-${zone}`}
    >
      {title && <h3 className="text-sm font-medium mb-2">{title}</h3>}
      <SortableContext
        items={items.filter(Boolean).map(item => item.id)}
        strategy={zone === "rows" || zone === "unassigned" 
          ? verticalListSortingStrategy 
          : horizontalListSortingStrategy}
      >
        <div 
          className={`flex gap-2 ${zone === "rows" || zone === "unassigned" ? "flex-col" : "flex-row flex-wrap"}`}
          data-zone-container={zone}
        >
          {items.filter(Boolean).map(item => (
            <DraggableItem 
              key={item.id} 
              item={item} 
              zone={zone} 
              onRemove={onRemoveItem}
            />
          ))}
          {items.length === 0 && (
            <div 
              className="w-full h-16 flex items-center justify-center text-sm text-muted-foreground border border-dashed rounded-md"
              data-zone-empty={zone}
            >
              <span>拖拽字段到此区域</span>
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// 用于格式化显示的通用工具函数
function formatValue(value: number, type: string): string {
  if (type === "executionRate" || type === "yoyChange" || type === "momChange") {
    return `${(value * 100).toFixed(2)}%`
  } else if (type === "predictAmount" || type === "actualAmount") {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 0
    }).format(value)
  }
  return value.toString()
}

// 提取表格组件
function PivotTable({ 
  pivotData, 
  rows, 
  values, 
  isLoading, 
  data 
}: { 
  pivotData: PivotTable, 
  rows: Item[], 
  values: Item[], 
  isLoading: boolean,
  data: ReportData[]
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">加载数据中...</span>
      </div>
    );
  }
  
  if (pivotData.rows.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        {data.length === 0 ? '暂无数据，请检查数据来源' : '请配置报表维度和指标以查看数据'}
      </div>
    );
  }
  
  return (
    <div className="relative overflow-auto max-h-[600px] border rounded">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="font-bold sticky left-0 bg-background/95 backdrop-blur-sm shadow-[1px_0_0_0_#e5e7eb]">
              <div className="px-4 py-2 font-medium">
                {safeMap(rows, r => r.name).join(' / ')}
              </div>
            </TableHead>
            {safeMap(pivotData.headers, header => (
              safeMap(values, value => (
                <TableHead key={`${header.key}-${value.id}`} className="text-right whitespace-nowrap">
                  {header.label} - {value.name}
                </TableHead>
              ))
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pivotData.rows.map((row, rowIndex) => (
            <TableRow 
              key={row.key} 
              className={rowIndex % 2 === 0 ? 'bg-white hover:bg-muted/10' : 'bg-muted/20 hover:bg-muted/30'}
            >
              <TableCell className="font-medium sticky left-0 bg-inherit backdrop-blur-sm shadow-[1px_0_0_0_#e5e7eb] whitespace-nowrap">
                {row.label}
              </TableCell>
              {safeMap(pivotData.headers, header => (
                safeMap(values, value => {
                  const cellKey = `${header.key}|${value.fieldName}`;
                  const cellValue = row.values[cellKey] || 0;
                  
                  return (
                    <TableCell key={`${row.key}-${header.key}-${value.id}`} className="text-right whitespace-nowrap">
                      {formatValue(cellValue, value.id)}
                    </TableCell>
                  );
                })
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// 图表组件
function ChartDisplay({
  chartType,
  chartData,
  pivotData,
  values,
  isLoading,
  colorMap,
  onChartTypeChange
}: {
  chartType: 'bar' | 'line' | 'pie' | 'stacked-bar' | 'stacked-column',
  chartData: any[],
  pivotData: PivotTable,
  values: Item[],
  isLoading: boolean,
  colorMap: Record<string, string>,
  onChartTypeChange: (type: 'bar' | 'line' | 'pie' | 'stacked-bar' | 'stacked-column') => void
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8 h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">加载图表中...</span>
      </div>
    )
  }
  
  if (chartData.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        没有可视化数据
      </div>
    )
  }

  // 为图表格式化数据标签
  const formatTooltip = (value: number, name: string, props: any) => {
    // 从名称中提取字段信息
    const fieldName = name.split(' - ')[1];
    const columnName = name.split(' - ')[0];
    const field = values.find(v => v.name === fieldName);
    return [
      formatValue(value, field?.id || ''),
      `列：${columnName}`,
      `指标：${fieldName}`
    ];
  }

  // 图表类型选择器
  const ChartTypeSelector = () => (
    <div className="flex items-center gap-2 mb-4 justify-end">
      <span className="text-sm text-muted-foreground">图表类型:</span>
      <div className="flex gap-1">
        <Button 
          variant={chartType === 'bar' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8 px-2"
          onClick={() => onChartTypeChange('bar')}
        >
          <BarChart3 size={16} className="mr-1" />
          柱状图
        </Button>
        <Button 
          variant={chartType === 'line' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8 px-2"
          onClick={() => onChartTypeChange('line')}
        >
          <LineChartIcon size={16} className="mr-1" />
          折线图
        </Button>
        <Button 
          variant={chartType === 'pie' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8 px-2"
          onClick={() => onChartTypeChange('pie')}
        >
          <PieChartIcon size={16} className="mr-1" />
          饼图
        </Button>
        <Button 
          variant={chartType === 'stacked-column' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8 px-2"
          onClick={() => onChartTypeChange('stacked-column')}
        >
          <BarChart4 size={16} className="mr-1" />
          堆积柱状图
        </Button>
        <Button 
          variant={chartType === 'stacked-bar' ? 'default' : 'outline'} 
          size="sm" 
          className="h-8 px-2"
          onClick={() => onChartTypeChange('stacked-bar')}
        >
          <Menu size={16} className="mr-1" />
          堆积条形图
        </Button>
      </div>
    </div>
  );
  
  // 获取所有图表系列名称
  const seriesNames = Object.keys(chartData[0] || {}).filter(k => k !== 'name');
  
  // 获取饼图数据
  const getPieData = () => {
    if (chartData.length === 0 || !values[0]) return [];
    
    // 如果只有一个值指标，则直接使用行名称作为系列
    if (pivotData.headers.length <= 1) {
      return chartData.map(d => ({
        name: d.name,
        value: Object.entries(d)
          .filter(([key]) => key !== 'name')
          .reduce((sum, [_, value]) => (sum as number) + (value as number), 0)
      }));
    }
    
    // 否则，将所有列的值累加为一个系列
    return seriesNames.map(series => ({
      name: series,
      value: chartData.reduce((sum, row) => sum + (row[series] || 0), 0)
    }));
  };
  
  // 生成随机颜色
  const pieColors = [
    "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", 
    "#82ca9d", "#ffc658", "#8dd1e1", "#a4de6c", "#d0ed57"
  ];

  return (
    <div>
      <ChartTypeSelector />
      
      <div className="h-[400px]">
        {chartType === 'bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              {seriesNames.map((dataKey, index) => (
                <Bar 
                  key={dataKey}
                  dataKey={dataKey} 
                  fill={colorMap[dataKey] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'stacked-column' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              {seriesNames.map((dataKey, index) => (
                <Bar 
                  key={dataKey}
                  dataKey={dataKey} 
                  stackId="a"
                  fill={colorMap[dataKey] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'stacked-bar' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              {seriesNames.map((dataKey, index) => (
                <Bar 
                  key={dataKey}
                  dataKey={dataKey} 
                  stackId="a"
                  fill={colorMap[dataKey] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'line' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={formatTooltip} />
              <Legend />
              {seriesNames.map((dataKey, index) => (
                <Line 
                  key={dataKey}
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={colorMap[dataKey] || `#${Math.floor(Math.random()*16777215).toString(16)}`} 
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
        
        {chartType === 'pie' && (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={getPieData()}
                cx="50%"
                cy="50%"
                labelLine={true}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getPieData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatValue(value as number, values[0]?.id || '')} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// 增加帮助组件
function HelpTooltip({ content }: { content: string }) {
  return (
    <div className="inline-flex items-center ml-2">
      <div className="relative group">
        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-muted cursor-help">
          <span className="text-xs">?</span>
        </div>
        <div className="absolute z-10 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity bottom-full mb-2 -left-1/2 w-64 p-2 rounded shadow-lg bg-white border text-sm text-gray-800">
          {content}
        </div>
      </div>
    </div>
  )
}

// 创建一个排序按钮组件
function SortButton({ 
  item, 
  sortConfig, 
  onSortChange 
}: { 
  item: Item, 
  sortConfig: SortConfig | null, 
  onSortChange: (config: SortConfig | null) => void 
}) {
  const isActive = sortConfig?.fieldId === item.id;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant={isActive ? "secondary" : "outline"} 
          size="sm" 
          className="h-6 px-2 text-xs"
        >
          {item.name}
          {!isActive && <ArrowUpDown className="ml-1 h-3 w-3 opacity-50" />}
          {isActive && sortConfig.direction === 'asc' && <ArrowUp className="ml-1 h-3 w-3" />}
          {isActive && sortConfig.direction === 'desc' && <ArrowDown className="ml-1 h-3 w-3" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-24">
        <DropdownMenuItem onClick={() => onSortChange({ fieldId: item.id, direction: 'asc' })}>
          <ArrowUp className="mr-2 h-3.5 w-3.5" />
          <span>升序</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange({ fieldId: item.id, direction: 'desc' })}>
          <ArrowDown className="mr-2 h-3.5 w-3.5" />
          <span>降序</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onSortChange(null)}>
          <X className="mr-2 h-3.5 w-3.5" />
          <span>取消排序</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 新增FilterPanel组件 - 实现点击式筛选器
function FilterPanel({
  availableItems,
  activeFilters,
  filterConfigs,
  onAddFilter,
  onRemoveFilter,
  onUpdateFilter,
  data
}: {
  availableItems: Item[],
  activeFilters: Item[],
  filterConfigs: FilterConfig[],
  onAddFilter: (item: Item) => void,
  onRemoveFilter: (item: Item) => void,
  onUpdateFilter: (config: FilterConfig) => void,
  data?: ReportData[]
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  // 按类型分组可用项
  const groupedItems = useMemo(() => {
    const dimensions = availableItems.filter(item => item.type === "dimension");
    const metrics = availableItems.filter(item => item.type === "metric");
    return { dimensions, metrics };
  }, [availableItems]);
  
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">过滤器设置</CardTitle>
            <CardDescription>设置数据筛选条件</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1" 
            onClick={() => setIsOpen(!isOpen)}
          >
            <Filter size={16} />
            <span>新增筛选项</span>
            <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      
      {isOpen && (
        <div className="mx-6 mb-3 border rounded-md p-3">
          <div className="mb-2 font-medium text-sm text-gray-700">选择筛选字段</div>
          <div className="grid grid-cols-1 gap-1">
            <div>
              <div className="text-xs font-semibold mb-1 text-blue-600">维度</div>
              <div className="grid grid-cols-3 gap-1">
                {groupedItems.dimensions.map(item => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    title={item.name} // 添加标题属性，鼠标悬浮时显示完整名称
                    className={`h-7 text-xs justify-start ${activeFilters.some(f => f.id === item.id) ? 'bg-blue-50 border-blue-200' : ''}`}
                    onClick={() => {
                      if (!activeFilters.some(f => f.id === item.id)) {
                        onAddFilter(item);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" />
                    <span className="truncate">{item.name}</span>
                    {activeFilters.some(f => f.id === item.id) && (
                      <Check size={14} className="ml-1 text-blue-600" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="mt-2">
              <div className="text-xs font-semibold mb-1 text-green-600">指标</div>
              <div className="grid grid-cols-3 gap-1">
                {groupedItems.metrics.map(item => (
                  <Button
                    key={item.id}
                    variant="outline"
                    size="sm"
                    title={item.name} // 添加标题属性，鼠标悬浮时显示完整名称
                    className={`h-7 text-xs justify-start ${activeFilters.some(f => f.id === item.id) ? 'bg-green-50 border-green-200' : ''}`}
                    onClick={() => {
                      if (!activeFilters.some(f => f.id === item.id)) {
                        onAddFilter(item);
                      }
                      setIsOpen(false);
                    }}
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-1.5" />
                    <span className="truncate">{item.name}</span>
                    {activeFilters.some(f => f.id === item.id) && (
                      <Check size={14} className="ml-1 text-green-600" />
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <CardContent>
        {activeFilters.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <Filter size={24} className="mx-auto mb-2 opacity-50" />
            <p>暂无筛选条件，点击"新增筛选项"添加</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeFilters.map(item => (
              <FilterItem
                key={item.id}
                item={item}
                onUpdate={onUpdateFilter}
                onRemove={onRemoveFilter}
                data={data}
              />
            ))}
            
            {activeFilters.length > 0 && (
              <div className={`mt-3 p-2 rounded-md text-sm ${activeFilters.length > 0 ? 'bg-amber-50 border border-amber-200' : ''}`}>
                <div className="flex items-center gap-1 text-amber-700">
                  <Filter size={14} />
                  <span>{activeFilters.length} 个过滤条件已启用</span>
                </div>
              </div>
            )}
          </div>
        )}
        </CardContent>
      </Card>
  );
}

// 添加调试面板组件
function DebugPanel({ filterConfigs }: { filterConfigs: FilterConfig[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const activeFilters = filterConfigs.filter(f => f.enabled);
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-800 text-white rounded-md shadow-lg overflow-hidden">
        <div 
          className="px-3 py-2 flex justify-between items-center cursor-pointer hover:bg-gray-700"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Filter size={14} />
            <span className="text-xs font-medium">筛选状态</span>
            <Badge variant="secondary" className="bg-gray-700 text-gray-300 text-xs">
              {activeFilters.length}
            </Badge>
    </div>
          <ChevronDown 
            size={16} 
            className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
          />
        </div>
        
        {isExpanded && (
          <div className="p-3 max-h-80 overflow-auto bg-gray-900">
            <pre className="text-xs text-gray-300 whitespace-pre-wrap">
              {JSON.stringify(filterConfigs, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

// 排序控件组件
function SortControls({ 
  rows,
  columns,
  values,
  onSortChange,
  currentSort
}: { 
  rows: Item[],
  columns: Item[],
  values: Item[],
  onSortChange: (config: SortConfig | null) => void,
  currentSort: SortConfig | null
}) {
  return (
    <div className="border rounded-md p-3 bg-muted/20">
      <h3 className="text-sm font-medium mb-2">排序设置</h3>
      <div className="flex flex-wrap gap-2">
        {/* 行维度排序 */}
        {rows.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">行维度:</span>
            {rows.map(item => (
              <SortButton
                key={item.id}
                item={item}
                sortConfig={currentSort?.fieldId === item.id ? currentSort : null}
                onSortChange={onSortChange}
              />
            ))}
          </div>
        )}
        
        {/* 列维度排序 */}
        {columns.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 ml-4">
            <span className="text-xs text-muted-foreground">列维度:</span>
            {columns.map(item => (
              <SortButton
                key={item.id}
                item={item}
                sortConfig={currentSort?.fieldId === item.id ? currentSort : null}
                onSortChange={onSortChange}
              />
            ))}
          </div>
        )}
        
        {/* 值排序 */}
        {values.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 ml-4">
            <span className="text-xs text-muted-foreground">值:</span>
            {values.map(item => (
              <SortButton
                key={item.id}
                item={item}
                sortConfig={currentSort?.fieldId === item.id ? currentSort : null}
                onSortChange={onSortChange}
              />
            ))}
          </div>
        )}
        
        {rows.length === 0 && columns.length === 0 && values.length === 0 && (
          <p className="text-xs text-muted-foreground">请先添加行维度、列维度或值字段</p>
        )}
      </div>
    </div>
  );
}

// 添加使用说明组件
function UserGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            数据分析工具使用指南
          </DialogTitle>
          <DialogDescription>
            本工具帮助您以灵活的方式分析和可视化数据
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-primary text-lg">1. 配置数据透视表</h4>
              <ul className="list-disc list-inside space-y-2 pl-2 text-muted-foreground">
                <li>从<strong>未分配项</strong>中拖拽维度到<strong>行</strong>区域</li>
                <li>拖拽维度到<strong>列</strong>区域（可选）</li>
                <li>拖拽指标到<strong>值</strong>区域</li>
                <li>支持多维度分析和多指标对比</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-primary text-lg">2. 设置筛选条件</h4>
              <ul className="list-disc list-inside space-y-2 pl-2 text-muted-foreground">
                <li>点击<strong>新增筛选项</strong>选择维度或指标</li>
                <li>设置筛选条件（等于、大于、小于等）</li>
                <li>维度筛选支持多选</li>
                <li>使用开关可快速启用/禁用筛选条件</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-primary text-lg">3. 数据排序</h4>
              <ul className="list-disc list-inside space-y-2 pl-2 text-muted-foreground">
                <li>使用<strong>排序设置</strong>区域选择排序字段</li>
                <li>支持对行维度、列维度和值进行排序</li>
                <li>点击字段可选择升序或降序</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-primary text-lg">4. 数据可视化</h4>
              <ul className="list-disc list-inside space-y-2 pl-2 text-muted-foreground">
                <li>切换<strong>表格</strong>和<strong>图表</strong>视图</li>
                <li>图表支持多种类型：柱状图、折线图、饼图等</li>
                <li>表格支持横向滚动查看更多数据</li>
                <li>悬停在图表上可查看详细数据</li>
              </ul>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-md">
            <h4 className="font-semibold text-blue-700 flex items-center gap-1 mb-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lightbulb">
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path>
                <path d="M9 18h6"></path>
                <path d="M10 22h4"></path>
              </svg>
              使用技巧
            </h4>
            <ul className="list-disc list-inside space-y-1 pl-2 text-blue-700">
              <li>多个行维度可以创建层级结构的报表</li>
              <li>调整排序可以突出关键数据</li>
              <li>选择合适的图表类型可以更好地表达数据关系</li>
              <li>结合筛选器可以聚焦分析特定数据集</li>
            </ul>
          </div>
        </div>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button>关闭</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// 获取最新数据日期组件
function DataDateInfo({ data }: { data: ReportData[] }) {
  // 如果没有数据，则返回空
  if (!data || data.length === 0) return null;
  
  // 查找最新的资金需求预测和实际支付数据
  const latestPredictRecord = useMemo(() => {
    const predictRecords = data.filter(item => item.predictAmount > 0)
      .sort((a, b) => {
        // 按年月降序排序
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    return predictRecords[0];
  }, [data]);
  
  const latestActualRecord = useMemo(() => {
    const actualRecords = data.filter(item => item.actualAmount > 0)
      .sort((a, b) => {
        // 按年月降序排序
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
    
    return actualRecords[0];
  }, [data]);
  
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
      {latestPredictRecord && (
        <div className="flex items-center">
          <span className="font-medium mr-1">资金需求预测金额最新数据:</span>
          <span className="text-primary">{latestPredictRecord.year}年{latestPredictRecord.month}月</span>
        </div>
      )}
      
      {latestActualRecord && (
        <div className="flex items-center">
          <span className="font-medium mr-1">实际支付金额最新数据:</span>
          <span className="text-primary">{latestActualRecord.year}年{latestActualRecord.month}月</span>
        </div>
      )}
    </div>
  );
}

// 数据导出功能
function ExportDataButton({ 
  data, 
  filename = "数据分析导出",
  disabled = false
}: { 
  data: any[]; 
  filename?: string;
  disabled?: boolean;
}) {
  if (!data || data.length === 0) {
    return null;
  }

  const exportToExcel = () => {
    try {
      // 创建工作簿
      const wb = XLSX.utils.book_new();
      // 创建工作表
      const ws = XLSX.utils.json_to_sheet(data);
      // 将工作表添加到工作簿
      XLSX.utils.book_append_sheet(wb, ws, "数据");
      // 导出Excel文件
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `${filename}.xlsx`);
      
      toast.success("Excel文件导出成功");
    } catch (error) {
      console.error("导出Excel失败:", error);
      toast.error("导出Excel失败，请重试");
    }
  };

  const exportToCSV = () => {
    try {
      // 将数据转换为CSV工作表
      const ws = XLSX.utils.json_to_sheet(data);
      // 将工作表转换为CSV字符串
      const csvOutput = XLSX.utils.sheet_to_csv(ws);
      // 创建Blob对象
      const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
      // 下载文件
      saveAs(blob, `${filename}.csv`);
      
      toast.success("CSV文件导出成功");
    } catch (error) {
      console.error("导出CSV失败:", error);
      toast.error("导出CSV失败，请重试");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="default" 
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <Download size={16} />
          <span>导出数据</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel}>
          导出为Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV}>
          导出为CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// 报表页面主组件
export default function QueryPage() {
  // 定义所有可用的维度和指标
  const allItems = useMemo<Item[]>(() => [
    { id: "orgName", name: "机构", fieldName: "orgName", type: "dimension" },
    { id: "orgCode", name: "机构编号", fieldName: "orgCode", type: "dimension" },
    { id: "departmentName", name: "部门", fieldName: "departmentName", type: "dimension" },
    { id: "departmentCode", name: "部门编号", fieldName: "departmentCode", type: "dimension" },
    { id: "projectCategoryName", name: "项目分类", fieldName: "projectCategoryName", type: "dimension" },
    { id: "projectName", name: "项目名称", fieldName: "projectName", type: "dimension" },
    { id: "projectCode", name: "项目编号", fieldName: "projectCode", type: "dimension" },
    { id: "subProjectName", name: "子项目名称", fieldName: "subProjectName", type: "dimension" },
    { id: "subProjectCode", name: "子项目编号", fieldName: "subProjectCode", type: "dimension" },
    { id: "fundTypeName", name: "资金类型", fieldName: "fundTypeName", type: "dimension" },
    { id: "year", name: "年份", fieldName: "year", type: "dimension" },
    { id: "month", name: "月份", fieldName: "month", type: "dimension" },
    { id: "submittedDate", name: "提交日期", fieldName: "submittedDate", type: "dimension" },
    { id: "predictAmount", name: "资金需求预测金额", fieldName: "predictAmount", type: "metric" },
    { id: "actualAmount", name: "实际支付金额", fieldName: "actualAmount", type: "metric" },
    { id: "executionRate", name: "预算执行率", fieldName: "executionRate", type: "metric" },
    { id: "yoyChange", name: "同比", fieldName: "yoyChange", type: "metric" },
    { id: "momChange", name: "环比", fieldName: "momChange", type: "metric" }
  ], []);
  
  // 状态管理
  const [rows, setRows] = useState<Item[]>(() => [
    allItems.find(item => item.id === "year")!,
    allItems.find(item => item.id === "month")!
  ]);
  
  const [columns, setColumns] = useState<Item[]>([]);
  
  const [values, setValues] = useState<Item[]>(() => [
    allItems.find(item => item.id === "predictAmount")!,
    allItems.find(item => item.id === "actualAmount")!
  ]);
  
  // 过滤器相关状态
  const [filters, setFilters] = useState<Item[]>([]);
  
  // 过滤器配置状态
  const [filterConfigs, setFilterConfigs] = useState<FilterConfig[]>([]);
  
  const [unassignedItems, setUnassignedItems] = useState<Item[]>(
    allItems.filter(item => 
      !rows.some(r => r.id === item.id) &&
      !columns.some(c => c.id === item.id) &&
      !values.some(v => v.id === item.id) &&
      !filters.some(f => f.id === item.id)
    )
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeZone, setActiveZone] = useState<Zone | null>(null);

  // 配置拖拽传感器
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5, // 5px 的移动距离后激活拖拽
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100, // 100ms 的延迟后激活拖拽
        tolerance: 5, // 5px 的移动容差
      },
    })
  );

  // 测量策略配置
  const measuringConfig = {
    droppable: {
      strategy: MeasuringStrategy.Always,
    },
  };
  
  // 获取指定区域的项目列表
  const getZoneItems = useCallback((zone: Zone): Item[] => {
    switch (zone) {
      case 'rows':
        return safeFilter(rows);
      case 'columns':
        return safeFilter(columns);
      case 'values':
        return safeFilter(values);
      case 'filters':
        return safeFilter(filters);
      case 'unassigned':
        return safeFilter(unassignedItems);
      default:
        return [];
    }
  }, [rows, columns, values, filters, unassignedItems]);

  // 更新指定区域的项目列表
  const updateZoneItems = useCallback((zone: Zone, items: Item[]) => {
    switch (zone) {
      case 'rows':
        setRows(items);
        break;
      case 'columns':
        setColumns(items);
        break;
      case 'values':
        setValues(items);
        break;
      case 'filters':
        setFilters(items);
        break;
      case 'unassigned':
        setUnassignedItems(items);
        break;
    }
  }, [setRows, setColumns, setValues, setFilters, setUnassignedItems]);
  
  // 拖拽开始事件处理
  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current as { item: Item; zone: Zone };
    console.log('拖拽开始:', {
      activeId: active.id,
      activeItem: activeData.item,
      sourceZone: activeData.zone
    });
    setActiveId(active.id as string);
    document.body.classList.add('dragging');
  }, []);

  // 拖拽悬停事件处理
  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = active.data.current as { item: Item; zone: Zone };
    const overData = over.data.current as { type: 'zone'; zone: Zone } | { item: Item; zone: Zone };
    
    console.log('拖拽悬停:', {
      activeId: active.id,
      activeItem: activeData.item,
      sourceZone: activeData.zone,
      targetZone: overData.zone
    });
    
    if (overData.zone !== activeData.zone) {
      setActiveZone(overData.zone);
    }
  }, []);

  // 拖拽结束事件处理
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      console.log('拖拽取消: 没有有效的放置目标');
      setActiveId(null);
      setActiveZone(null);
      document.body.classList.remove('dragging');
      return;
    }
    
    const activeData = active.data.current as { item: Item; zone: Zone };
    const overData = over.data.current as { type: 'zone'; zone: Zone } | { item: Item; zone: Zone };
    const activeItem = activeData.item;
    
    console.log('拖拽结束:', {
      activeId: active.id,
      activeItem: activeData.item,
      sourceZone: activeData.zone,
      targetZone: overData.zone,
      overTarget: over.id
    });
    
    // 从源区域移除
    const sourceZone = activeData.zone;
    const targetZone = overData.zone;
    
    if (sourceZone === targetZone) {
      // 同一区域内的排序
      const items = getZoneItems(sourceZone);
      const oldIndex = items.findIndex((item: Item) => item.id === activeItem.id);
      const newIndex = items.findIndex((item: Item) => {
        if ('item' in overData) {
          return item.id === overData.item.id;
        }
        return false;
      });
      
      if (oldIndex !== -1 && newIndex !== -1) {
        console.log('同区域排序:', {
          zone: sourceZone,
          oldIndex,
          newIndex,
          items: items.filter(Boolean).map((i: Item) => i.name)
        });
        const newItems = [...items];
        const [removed] = newItems.splice(oldIndex, 1);
        newItems.splice(newIndex, 0, removed);
        updateZoneItems(sourceZone, newItems);
      }
    } else {
      // 不同区域间的移动
      console.log('跨区域移动:', {
        sourceZone,
        targetZone,
        item: activeItem.name
      });
      const sourceItems = getZoneItems(sourceZone).filter((item: Item) => item.id !== activeItem.id);
      const targetItems = getZoneItems(targetZone);
      
      updateZoneItems(sourceZone, sourceItems);
      updateZoneItems(targetZone, [...targetItems, activeItem]);
    }
    
    setActiveId(null);
    setActiveZone(null);
    document.body.classList.remove('dragging');
  }, [getZoneItems, updateZoneItems]);
  
  // 从API获取数据
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // 增加排序状态
  const [rowSort, setRowSort] = useState<SortConfig | null>(null);
  const [columnSort, setColumnSort] = useState<SortConfig | null>(null);
  
  // 图表颜色映射
  const colorMap = {
    predictAmount: "#4f46e5",
    actualAmount: "#16a34a",
    executionRate: "#ea580c",
    yoyChange: "#0891b2",
    momChange: "#db2777"
  };

  // 图表类型
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'stacked-bar' | 'stacked-column'>('bar');

  // 应用排序
  const applySorting = useCallback((data: ReportData[]): ReportData[] => {
    if (!rowSort && !columnSort) return data;
    
    return [...data].sort((a, b) => {
      // 如果是行排序
      if (rowSort) {
        const fieldA = a[rowSort.fieldId] || 0;
        const fieldB = b[rowSort.fieldId] || 0;
        
        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return rowSort.direction === 'asc' ? fieldA - fieldB : fieldB - fieldA;
        } else {
          const strA = String(fieldA).toLowerCase();
          const strB = String(fieldB).toLowerCase();
          return rowSort.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }
      }
      
      // 如果是列排序
      if (columnSort) {
        const fieldA = a[columnSort.fieldId] || 0;
        const fieldB = b[columnSort.fieldId] || 0;
        
        if (typeof fieldA === 'number' && typeof fieldB === 'number') {
          return columnSort.direction === 'asc' ? fieldA - fieldB : fieldB - fieldA;
        } else {
          const strA = String(fieldA).toLowerCase();
          const strB = String(fieldB).toLowerCase();
          return columnSort.direction === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
        }
      }
      
      return 0;
    });
  }, [rowSort, columnSort]);

  // 处理数据透视
  const pivotData = useMemo(() => {
    if (!data || data.length === 0) {
      return { headers: [], rows: [] };
    }

    // 应用过滤器
    const filteredData = data.filter(record => {
      return filterConfigs.every(filter => {
        if (!filter.enabled) return true;
        
        const item = allItems.find(item => item.id === filter.itemId);
        if (!item) return true;
        
        const value = record[item.fieldName];
        if (value === undefined) return true;
        
        switch (filter.operator) {
          case 'equals':
            if (Array.isArray(filter.value)) {
              return (filter.value as string[]).length === 0 || (filter.value as string[]).includes(String(value));
            }
            return String(value) === String(filter.value);
          case 'contains':
            if (Array.isArray(filter.value)) {
              return (filter.value as string[]).length === 0 || (filter.value as string[]).some(v => String(value).includes(String(v)));
            }
            return String(value).includes(String(filter.value));
          case 'greaterThan':
            return typeof value === 'number' && value > Number(filter.value);
          case 'lessThan':
            return typeof value === 'number' && value < Number(filter.value);
          case 'between':
            if (Array.isArray(filter.value) && filter.value.length === 2) {
              const [min, max] = (filter.value as [number, number]).map(Number);
              return typeof value === 'number' && value >= min && value <= max;
            }
            return true;
          default:
            return true;
        }
      });
    });

    // 应用排序
    const sortedData = applySorting(filteredData);

    // 生成行标识
    const getRowKey = (record: ReportData) => {
      return rows.map(row => String(record[row.fieldName])).join('|');
    };

    // 生成列标识
    const getColumnKey = (record: ReportData) => {
      return columns.map(col => String(record[col.fieldName])).join('|');
    };

    // 生成行标签
    const getRowLabel = (record: ReportData) => {
      return rows.map(row => String(record[row.fieldName])).join(' / ');
    };

    // 生成列标签
    const getColumnLabel = (record: ReportData) => {
      return columns.map(col => String(record[col.fieldName])).join(' / ');
    };

    // 收集所有唯一的行和列
    const uniqueRows = new Map<string, { key: string; label: string; items: PivotRowItem[] }>();
    const uniqueColumns = new Map<string, { key: string; label: string; items: PivotRowItem[] }>();

    sortedData.forEach(record => {
      const rowKey = getRowKey(record);
      const columnKey = getColumnKey(record);
      const rowLabel = getRowLabel(record);
      const columnLabel = getColumnLabel(record);

      if (!uniqueRows.has(rowKey)) {
        uniqueRows.set(rowKey, {
          key: rowKey,
          label: rowLabel,
          items: rows.map(row => ({
            field: row.fieldName,
            value: record[row.fieldName]
          }))
        });
      }

      if (columns.length > 0 && !uniqueColumns.has(columnKey)) {
        uniqueColumns.set(columnKey, {
          key: columnKey,
          label: columnLabel,
          items: columns.map(col => ({
            field: col.fieldName,
            value: record[col.fieldName]
          }))
        });
      }
    });

    // 如果没有设置列，则使用一个默认列
    if (columns.length === 0) {
      uniqueColumns.set('total', {
        key: 'total',
        label: '总计',
        items: []
      });
    }

    // 构建数据透视表
    const headers = Array.from(uniqueColumns.values());
    const pivotRows = Array.from(uniqueRows.values()).map(row => {
      const rowValues: Record<string, number> = {};

      // 对每个列和值的组合计算聚合值
      headers.forEach(header => {
        // 对每个值字段计算聚合值
        for (const value of values) {
          const key = `${header.key}|${value.fieldName}`;
          const matchingRecords = sortedData.filter(record => 
            getRowKey(record) === row.key && 
            (columns.length === 0 || getColumnKey(record) === header.key)
          );

          if (matchingRecords.length > 0) {
            const sum = matchingRecords.reduce((acc, record) => {
              const val = record[value.fieldName];
              return acc + (typeof val === 'number' ? val : 0);
            }, 0);
            
            // 如果是平均值类型的指标，则计算平均值
            if (value.id === 'executionRate' || value.id === 'yoyChange' || value.id === 'momChange') {
              rowValues[key] = sum / matchingRecords.length;
            } else {
              rowValues[key] = sum;
            }
          } else {
            rowValues[key] = 0;
          }
        }
      });

      return {
        key: row.key,
        label: row.label,
        items: row.items,
        values: rowValues
      };
    });

    return {
      headers,
      rows: pivotRows,
      valueFields: values.map(v => v.fieldName)
    };
  }, [data, rows, columns, values, filterConfigs, allItems, applySorting]);

  // 图表数据处理
  const chartData = useMemo(() => {
    if (!pivotData || pivotData.rows.length === 0) {
      return [];
    }

    return pivotData.rows.map(row => {
      const chartRow: any = {
        name: row.label
      };

      pivotData.headers.forEach(header => {
        values.forEach(value => {
          const key = `${header.key}|${value.fieldName}`;
          chartRow[`${header.label} - ${value.name}`] = row.values[key] || 0;
        });
      });

      return chartRow;
    });
  }, [pivotData, values]);
  
  // 更新过滤器配置
  const updateFilter = useCallback((config: FilterConfig) => {
    setFilterConfigs(prev => {
      const existingIndex = prev.findIndex(fc => fc.itemId === config.itemId);
      if (existingIndex >= 0) {
        const newConfigs = [...prev];
        newConfigs[existingIndex] = config;
        return newConfigs;
      }
      return [...prev, config];
    });
  }, []);
  
  // 添加过滤器
  const addFilter = useCallback((item: Item) => {
    // 添加到filters数组
    setFilters(prev => [...prev, item]);
    
    // 初始化过滤器配置
    const newConfig: FilterConfig = {
      itemId: item.id,
      operator: item.type === 'dimension' ? 'equals' : 'greaterThan',
      value: item.type === 'dimension' ? [] as string[] : 0,
      enabled: true
    };
    
    // 更新过滤器配置
    updateFilter(newConfig);
    
    // 从未分配项中移除该项
    setUnassignedItems(prev => prev.filter(i => i.id !== item.id));
    
    toast.success(`已添加"${item.name}"筛选条件`);
  }, [updateFilter]);
  
  // 从API获取分析数据
  const fetchAnalysisData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await fetch('/api/analysis')
      
      if (!response.ok) {
        throw new Error('数据获取失败')
      }
      
      const result = await response.json()
      setData(result.data)
      toast.success('数据已成功加载')
    } catch (err) {
      console.error('加载分析数据失败:', err)
      setError(err instanceof Error ? err.message : '未知错误')
      toast.error('加载数据失败，请稍后重试')
      
      // 如果API请求失败，使用示例数据
      setData([
        {
          id: "1",
          orgId: "org1",
          orgName: "北京分公司",
          orgCode: "BJ001",
          departmentId: "dept1",
          departmentName: "信息技术部",
          departmentCode: "IT001",
          projectCategoryId: "cat1",
          projectCategoryName: "基础设施",
          projectId: "proj1",
          projectName: "数据中心建设",
          projectCode: "DC001",
          subProjectId: "sub1",
          subProjectName: "服务器采购",
          subProjectCode: "SRV001",
          fundTypeId: "fund1",
          fundTypeName: "设备购置",
          year: 2023,
          month: 1,
          submittedDate: "2023-01-15",
          predictAmount: 1000000,
          actualAmount: 980000,
          executionRate: 0.98,
          yoyChange: 0.05,
          momChange: 0.02
        },
        {
          id: "2",
          orgId: "org1",
          orgName: "北京分公司",
          orgCode: "BJ001",
          departmentId: "dept1",
          departmentName: "信息技术部",
          departmentCode: "IT001",
          projectCategoryId: "cat1",
          projectCategoryName: "基础设施",
          projectId: "proj1",
          projectName: "数据中心建设",
          projectCode: "DC001",
          subProjectId: "sub1",
          subProjectName: "服务器采购",
          subProjectCode: "SRV001",
          fundTypeId: "fund1",
          fundTypeName: "设备购置",
          year: 2023,
          month: 2,
          submittedDate: "2023-02-15",
          predictAmount: 500000,
          actualAmount: 490000,
          executionRate: 0.98,
          yoyChange: 0.03,
          momChange: -0.5
        },
        {
          id: "3",
          orgId: "org2",
          orgName: "上海分公司",
          orgCode: "SH001",
          departmentId: "dept2",
          departmentName: "研发部",
          departmentCode: "RD001",
          projectCategoryId: "cat2",
          projectCategoryName: "研发项目",
          projectId: "proj2",
          projectName: "AI平台开发",
          projectCode: "AI001",
          subProjectId: "sub2",
          subProjectName: "算法研发",
          subProjectCode: "ALG001",
          fundTypeId: "fund2",
          fundTypeName: "研发支出",
          year: 2023,
          month: 1,
          submittedDate: "2023-01-20",
          predictAmount: 2000000,
          actualAmount: 1800000,
          executionRate: 0.9,
          yoyChange: 0.1,
          momChange: 0.05
        },
        {
          id: "4",
          orgId: "org2",
          orgName: "上海分公司",
          orgCode: "SH001",
          departmentId: "dept2",
          departmentName: "研发部",
          departmentCode: "RD001",
          projectCategoryId: "cat2",
          projectCategoryName: "研发项目",
          projectId: "proj2",
          projectName: "AI平台开发",
          projectCode: "AI001",
          subProjectId: "sub2",
          subProjectName: "算法研发",
          subProjectCode: "ALG001",
          fundTypeId: "fund2",
          fundTypeName: "研发支出",
          year: 2023,
          month: 2,
          submittedDate: "2023-02-20",
          predictAmount: 2200000,
          actualAmount: 2100000,
          executionRate: 0.95,
          yoyChange: 0.15,
          momChange: 0.17
        }
      ])
    } finally {
      setIsLoading(false)
    }
  // 函数不依赖任何外部状态，避免无限循环
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  
  // 组件加载时获取数据，仅执行一次
  useEffect(() => {
    fetchAnalysisData()
  }, [])
  
  // 刷新数据
  const refreshData = useCallback(() => {
    fetchAnalysisData()
  }, [fetchAnalysisData])
  
  // 使用说明弹窗状态
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">数据分析</h1>
        <div className="flex items-center gap-2">
          <ExportDataButton 
            data={data} 
            filename={`数据分析导出_${new Date().toISOString().split('T')[0]}`}
            disabled={isLoading || !data || data.length === 0}
          />
          <Button
            variant="outline"
            size="default"
            onClick={() => setIsGuideOpen(true)}
            className="flex items-center gap-1"
          >
            <Sparkles size={16} />
            <span>使用说明</span>
          </Button>
          <Button
            variant="default"
            size="default"
            onClick={refreshData}
            disabled={isLoading}
            className="flex items-center gap-1"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            <span>刷新数据</span>
          </Button>
        </div>
      </div>
      
      {/* 使用说明弹窗 */}
      <UserGuide open={isGuideOpen} onOpenChange={setIsGuideOpen} />
      
      {/* 数据日期信息 */}
      <DataDateInfo data={data} />
      
      <div className="grid grid-cols-12 gap-6">
        {/* 配置区域 */}
        <div className="col-span-12 lg:col-span-2 lg:order-1 space-y-6">
          {/* 筛选器设置 */}
          <FilterPanel 
            availableItems={allItems.filter(item => !filters.some(f => f.id === item.id))}
            activeFilters={filters}
            filterConfigs={filterConfigs}
            onAddFilter={addFilter}
            onRemoveFilter={(item) => {
              setFilters(prev => prev.filter(i => i.id !== item.id));
              setFilterConfigs(prev => prev.filter(fc => fc.itemId !== item.id));
              setUnassignedItems(prev => [...prev, item]);
              toast.success(`已移除"${item.name}"筛选条件`);
            }}
            onUpdateFilter={updateFilter}
            data={data}
          />

          {/* 数据透视表配置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">数据透视表</CardTitle>
              <CardDescription>
                拖拽字段到相应区域构建数据透视表
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
              >
                <div className="space-y-4">
                  <div className="space-y-4">
                    <ItemZone
                      title="行"
                      items={rows}
                      zone="rows"
                      onRemoveItem={(item) => {
                        setRows(rows.filter(i => i.id !== item.id));
                        setUnassignedItems([...unassignedItems, item]);
                      }}
                    />
                    <ItemZone
                      title="列"
                      items={columns}
                      zone="columns"
                      onRemoveItem={(item) => {
                        setColumns(columns.filter(i => i.id !== item.id));
                        setUnassignedItems([...unassignedItems, item]);
                      }}
                    />
                    <ItemZone
                      title="值"
                      items={values}
                      zone="values"
                      onRemoveItem={(item) => {
                        setValues(values.filter(i => i.id !== item.id));
                        setUnassignedItems([...unassignedItems, item]);
                      }}
                    />
                    <ItemZone
                      title="未分配项"
                      items={unassignedItems}
                      zone="unassigned"
                      onRemoveItem={(item) => {
                        setUnassignedItems(unassignedItems.filter(i => i.id !== item.id));
                      }}
                    />
                  </div>
                </div>
                <DragOverlay>
                  {activeId ? (
                    <DraggableItem
                      item={allItems.find(item => item.id === activeId)!}
                      zone={activeZone || "unassigned"}
                      onRemove={(item) => {
                        setUnassignedItems([...unassignedItems, item]);
                      }}
                    />
                  ) : null}
                </DragOverlay>
              </DndContext>
            </CardContent>
          </Card>
        </div>

        {/* 数据展示区域 */}
        <div className="col-span-12 lg:col-span-10 lg:order-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between">
                <div>
                  <CardTitle className="text-lg">数据展示</CardTitle>
                  <CardDescription>根据配置生成的数据表格和图表</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 排序设置 */}
              <div className="mb-4">
                <SortControls 
                  rows={rows}
                  columns={columns}
                  values={values}
                  onSortChange={(config) => {
                    if (config) {
                      setRowSort(config);
                      setColumnSort(null);
                    } else {
                      setRowSort(null);
                      setColumnSort(null);
                    }
                  }}
                  currentSort={rowSort}
                />
              </div>
            
              <Tabs defaultValue="table">
                <div className="flex justify-end mb-4">
                  <TabsList>
                    <TabsTrigger value="table">表格</TabsTrigger>
                    <TabsTrigger value="chart">图表</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="table">
                  {rows.length > 0 && values.length > 0 ? (
                    <PivotTable 
                      pivotData={pivotData}
                      rows={rows}
                      values={values}
                      isLoading={isLoading}
                      data={data}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <p className="text-muted-foreground mb-2">请至少添加一个行维度和一个值指标</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="chart">
                  {rows.length > 0 && values.length > 0 ? (
                    <ChartDisplay 
                      chartType={chartType}
                      chartData={chartData}
                      pivotData={pivotData}
                      values={values}
                      isLoading={isLoading}
                      colorMap={colorMap}
                      onChartTypeChange={(type) => setChartType(type)}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-center">
                      <p className="text-muted-foreground mb-2">请至少添加一个行维度和一个值指标</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 添加调试面板 */}
      <DebugPanel filterConfigs={filterConfigs} />
    </div>
  );
}

