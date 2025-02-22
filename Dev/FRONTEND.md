# 前端开发文档
**版本**: 1.0
**更新日期**: 2024-08-25

## 一、UI设计规范

### 1. 设计系统
```typescript
// lib/design-tokens.ts
export const tokens = {
  // 颜色系统
  colors: {
    primary: '#2563eb',    // 主题色
    success: '#22c55e',    // 成功
    warning: '#f59e0b',    // 警告
    danger: '#ef4444',     // 危险
    info: '#3b82f6',       // 信息
    
    // 文本颜色
    text: {
      primary: '#1f2937',
      secondary: '#4b5563',
      disabled: '#9ca3af',
    },
    
    // 背景颜色
    background: {
      primary: '#ffffff',
      secondary: '#f3f4f6',
      hover: '#f9fafb',
    },
    
    // 边框颜色
    border: {
      default: '#e5e7eb',
      focus: '#3b82f6',
    }
  },

  // 间距系统
  spacing: {
    xs: '0.25rem',    // 4px
    sm: '0.5rem',     // 8px
    md: '1rem',       // 16px
    lg: '1.5rem',     // 24px
    xl: '2rem',       // 32px
  },

  // 字体系统
  typography: {
    fontSizes: {
      xs: '0.75rem',  // 12px
      sm: '0.875rem', // 14px
      md: '1rem',     // 16px
      lg: '1.125rem', // 18px
      xl: '1.25rem',  // 20px
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      bold: 700,
    }
  },

  // 圆角
  borderRadius: {
    sm: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },

  // 阴影
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
  }
}
```

### 2. 组件规范
- 使用Shadcn UI作为基础组件库
- 遵循无障碍设计规范(ARIA)
- 支持暗色模式
- 响应式设计

## 二、组件库设计

### 1. 基础组件
```typescript
// components/ui/button.tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

// components/ui/input.tsx
interface InputProps {
  type: 'text' | 'number' | 'password';
  error?: string;
  helper?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

// 更多基础组件...
```

### 2. 业务组件
```typescript
// components/funding/funding-table.tsx
interface FundingTableProps {
  mode: 'predict' | 'actual' | 'audit';
  data: Record[];
  loading?: boolean;
  onSave: (records: Record[]) => Promise<void>;
  onSubmit: (records: Record[]) => Promise<void>;
}

// components/project/project-selector.tsx
interface ProjectSelectorProps {
  multiple?: boolean;
  organizationId?: string;
  onChange: (projectIds: string[]) => void;
}
```

## 三、状态管理

### 1. 全局状态
```typescript
// lib/store/auth.ts
interface AuthState {
  user: User | null;
  organization: Organization | null;
  permissions: Permission[];
}

// lib/store/app.ts
interface AppState {
  theme: 'light' | 'dark';
  sidebarCollapsed: boolean;
  notifications: Notification[];
}
```

### 2. 表单状态
```typescript
// hooks/use-funding-form.ts
export function useFundingForm(props: FundingFormProps) {
  // 表单状态
  const form = useForm({
    defaultValues: props.initialData,
    resolver: zodResolver(fundingSchema)
  });

  // 自动保存
  useAutoSave(form, {
    url: '/api/records/draft',
    interval: 30000
  });

  // 数据验证
  const validate = async (data: Record[]) => {
    // 实现验证逻辑
  };

  return {
    form,
    validate,
    // 其他方法...
  };
}
```

## 四、页面路由设计

### 1. 路由结构
```
app/
  ├── (auth)/           # 认证相关页面
  │   ├── login/
  │   └── register/
  ├── (dashboard)/      # 主应用页面
  │   ├── projects/     # 项目管理
  │   ├── funding/      # 资金填报
  │   │   ├── predict/  # 预测填报
  │   │   ├── actual/   # 实际填报
  │   │   └── audit/    # 财务审核
  │   └── analysis/     # 数据分析
  └── layout.tsx        # 布局组件
```

### 2. 中间件
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 路由权限控制
  // 用户认证检查
  // 请求日志记录
}
```

## 五、性能优化

### 1. 代码分割
- 路由级别分割
- 组件懒加载
- 第三方库按需导入

### 2. 渲染优化
- 使用React.memo()
- 虚拟滚动
- 防抖与节流

### 3. 资源优化
- 图片懒加载
- 静态资源CDN
- 缓存策略

## 六、开发规范

### 1. 组件开发规范
- 单一职责原则
- Props类型定义
- 错误边界处理
- 注释规范

### 2. 样式开发规范
- 使用Tailwind CSS
- 组件样式隔离
- 主题变量复用
- 响应式设计

### 3. 测试规范
- 组件单元测试
- 交互测试
- 快照测试
- 性能测试

## 七、常见问题

### 1. 表单处理
- 大数据量表格优化
- 表单验证策略
- 自动保存机制
- 并发提交处理

### 2. 状态管理
- 全局状态设计
- 状态持久化
- 状态同步策略
- 内存泄漏防范

### 3. 性能问题
- 首屏加载优化
- 长列表渲染
- 频繁更新处理
- 网络请求优化 