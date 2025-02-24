# API接口文档
**版本**: 1.0
**更新日期**: 2024-08-25

## 一、接口规范

### 1. 请求格式
```typescript
interface ApiRequest {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  query?: Record<string, string>;
  body?: unknown;
  headers: {
    'Content-Type': 'application/json';
    Authorization: string;
  };
}
```

### 2. 响应格式
```typescript
interface ApiResponse<T> {
  code: number;      // 状态码
  message: string;   // 响应消息
  data?: T;         // 响应数据
  timestamp: number; // 时间戳
}
```

### 3. 错误码定义
| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 200 | 成功 | - |
| 400 | 请求参数错误 | 检查请求参数 |
| 401 | 未授权 | 检查登录状态 |
| 403 | 权限不足 | 检查用户权限 |
| 404 | 资源不存在 | 检查请求路径 |
| 500 | 服务器错误 | 联系管理员 |

## 二、认证接口

### 1. 用户登录
- **路径**: POST /api/auth/login
- **权限**: 公开
- **请求体**:
```typescript
interface LoginRequest {
  username: string;
  password: string;
}
```
- **响应**:
```typescript
interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    role: string;
    organizationId: string;
  };
}
```

### 2. 刷新令牌
- **路径**: POST /api/auth/refresh
- **权限**: 已登录用户
- **请求头**: 
  - Authorization: Bearer <token>
- **响应**:
```typescript
interface RefreshResponse {
  token: string;
  expiresIn: number;
}
```

## 三、机构管理接口

### 1. 获取机构列表
- **路径**: GET /api/organizations
- **权限**: 已登录用户
- **查询参数**:
  - page: 页码
  - pageSize: 每页数量
  - search: 搜索关键词
  - sorting: 排序参数
    - field: 排序字段
    - order: 排序方向 (asc/desc)

### 2. 创建机构
- **路径**: POST /api/v1/organizations
- **权限**: 管理员
- **请求体**:
```typescript
interface CreateOrgRequest {
  name: string;
  code: string;
  departments: {
    name: string;
  }[];
}
```

### 3. 获取机构详情
- **路径**: GET /api/organizations/:id
- **权限**: 已登录用户

### 4. 更新机构
- **路径**: PUT /api/organizations/:id
- **权限**: 管理员
- **请求体**:
```typescript
interface UpdateOrgRequest {
  name?: string;
  code?: string;
  departments?: {
    id?: string;
    name: string;
  }[];
}
```

### 5. 删除机构
- **路径**: DELETE /api/organizations/:id
- **权限**: 管理员

### 6. 创建部门
- **路径**: POST /api/v1/organizations/:id/departments
- **权限**: 管理员
- **请求体**:
```typescript
interface CreateDepartmentRequest {
  name: string;
}
```

### 7. 更新部门
- **路径**: PUT /api/organizations/:id/departments/:departmentId
- **权限**: 管理员
- **请求体**:
```typescript
interface UpdateDepartmentRequest {
  name: string;
}
```

### 8. 删除部门
- **路径**: DELETE /api/organizations/:id/departments/:departmentId
- **权限**: 管理员

### 9. 管理部门
- **路径**: POST /api/v1/organizations/:id/departments
- **权限**: 管理员
- **请求体**:
```typescript
interface ManageDepartmentRequest {
  operation: 'ADD' | 'REMOVE' | 'UPDATE';
  departments: string[];
}
```

## 四、项目管理接口

### 1. 创建项目
- **路径**: POST /api/projects
- **权限**: 管理员
- **请求体**:
```typescript
interface CreateProjectRequest {
  name: string;
  organizationIds: string[];
  departmentIds: string[];
  subProjects: {
    name: string;
    fundTypeIds: string[];
  }[];
}
```

### 2. 更新项目
- **路径**: PUT /api/projects/:id
- **权限**: 管理员
- **请求体**:
```typescript
interface UpdateProjectRequest {
  name?: string;
  organizationIds?: string[];
  departmentIds?: string[];
  subProjects?: {
    id?: string;
    name: string;
    fundTypeIds: string[];
  }[];
}
```

## 五、资金填报接口

### 1. 提交预测数据
- **路径**: POST /api/records/predict
- **权限**: 填报人
- **请求体**:
```typescript
interface SubmitPredictRequest {
  records: {
    subProjectId: string;
    year: number;
    month: number;
    amount: number;
  }[];
}
```

### 2. 提交实际支付
- **路径**: POST /api/records/actual
- **权限**: 填报人、填报财务
- **请求体**:
```typescript
interface SubmitActualRequest {
  records: {
    subProjectId: string;
    year: number;
    month: number;
    amount: number;
    type: 'user' | 'finance';
  }[];
}
```

### 3. 审核数据
- **路径**: POST /api/records/audit
- **权限**: 审核财务
- **请求体**:
```typescript
interface AuditRequest {
  recordIds: string[];
  action: 'approve' | 'reject';
  comment?: string;
}
```

## 六、数据分析接口

### 1. 查询数据
- **路径**: POST /api/analysis/query
- **权限**: 已登录用户
- **请求体**:
```typescript
interface QueryRequest {
  dimensions: string[];
  metrics: string[];
  filters: {
    field: string;
    operator: 'eq' | 'gt' | 'lt' | 'between';
    value: any;
  }[];
  sorting: {
    field: string;
    order: 'asc' | 'desc';
  }[];
  pagination: {
    page: number;
    pageSize: number;
  };
}
```

### 2. 导出数据
- **路径**: POST /api/analysis/export
- **权限**: 已登录用户
- **请求体**: 同查询数据
- **响应**: 文件流

## 七、系统配置接口

### 1. 获取系统配置
- **路径**: GET /api/config
- **权限**: 管理员
- **响应**:
```typescript
interface ConfigResponse {
  settings: {
    key: string;
    value: string;
    description: string;
  }[];
}
```

### 2. 更新系统配置
- **路径**: PUT /api/config
- **权限**: 管理员
- **请求体**:
```typescript
interface UpdateConfigRequest {
  settings: {
    key: string;
    value: string;
  }[];
}
```

## 八、文件上传接口

### 1. 上传文件
- **路径**: POST /api/upload
- **权限**: 已登录用户
- **请求体**: FormData
  - file: 文件
  - type: 文件类型
- **响应**:
```typescript
interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}
```

## 九、日志接口

### 1. 获取操作日志
- **路径**: GET /api/logs
- **权限**: 管理员
- **查询参数**:
  - startTime: 开始时间
  - endTime: 结束时间
  - type: 日志类型
  - userId: 用户ID
  - page: 页码
  - pageSize: 每页数量

[更多接口详情...] 