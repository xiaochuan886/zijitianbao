import { Role } from '@/lib/enums'

// 资源类型
export type Resource = 
  | 'organization'    // 机构
  | 'department'      // 部门
  | 'project'        // 项目
  | 'subProject'     // 子项目
  | 'fundType'       // 资金需求类型
  | 'record'         // 记录
  | 'user'           // 用户
  | 'system'         // 系统设置
  | 'report'         // 报表
  | 'dashboard'      // 数据看板

// 操作类型
export type Action = 
  | 'create'         // 创建
  | 'read'           // 读取
  | 'update'         // 更新
  | 'delete'         // 删除
  | 'submit'         // 提交
  | 'audit'          // 审核
  | 'export'         // 导出
  | 'archive'        // 归档
  | 'recall'         // 撤回
  | 'approve'        // 审批
  | 'configure'      // 配置

// 权限范围
export type Scope = 'all' | 'organization' | 'department' | 'self'

// 权限定义
export interface Permission {
  resource: Resource
  action: Action
  scope: Scope
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ADMIN: [
    // 系统管理权限
    { resource: 'system', action: 'configure', scope: 'all' },
    // 机构管理权限
    { resource: 'organization', action: 'create', scope: 'all' },
    { resource: 'organization', action: 'read', scope: 'all' },
    { resource: 'organization', action: 'update', scope: 'all' },
    { resource: 'organization', action: 'delete', scope: 'all' },
    // 用户管理权限
    { resource: 'user', action: 'create', scope: 'all' },
    { resource: 'user', action: 'read', scope: 'all' },
    { resource: 'user', action: 'update', scope: 'all' },
    { resource: 'user', action: 'delete', scope: 'all' },
    // 项目管理权限
    { resource: 'project', action: 'create', scope: 'all' },
    { resource: 'project', action: 'read', scope: 'all' },
    { resource: 'project', action: 'update', scope: 'all' },
    { resource: 'project', action: 'delete', scope: 'all' },
    { resource: 'project', action: 'archive', scope: 'all' },
    // 资金类型管理权限
    { resource: 'fundType', action: 'create', scope: 'all' },
    { resource: 'fundType', action: 'read', scope: 'all' },
    { resource: 'fundType', action: 'update', scope: 'all' },
    { resource: 'fundType', action: 'delete', scope: 'all' },
    // 审批权限
    { resource: 'record', action: 'approve', scope: 'all' },
  ],
  REPORTER: [
    // 项目查看权限
    { resource: 'project', action: 'read', scope: 'organization' },
    { resource: 'subProject', action: 'read', scope: 'organization' },
    // 记录管理权限
    { resource: 'record', action: 'create', scope: 'self' },
    { resource: 'record', action: 'read', scope: 'self' },
    { resource: 'record', action: 'update', scope: 'self' },
    { resource: 'record', action: 'submit', scope: 'self' },
    { resource: 'record', action: 'recall', scope: 'self' },
    // 报表权限
    { resource: 'report', action: 'read', scope: 'self' },
    { resource: 'report', action: 'export', scope: 'self' },
    // 看板权限
    { resource: 'dashboard', action: 'read', scope: 'self' },
  ],
  FINANCE: [
    // 项目查看权限
    { resource: 'project', action: 'read', scope: 'organization' },
    { resource: 'subProject', action: 'read', scope: 'organization' },
    // 记录管理权限
    { resource: 'record', action: 'read', scope: 'organization' },
    { resource: 'record', action: 'update', scope: 'organization' },
    { resource: 'record', action: 'submit', scope: 'organization' },
    // 报表权限
    { resource: 'report', action: 'read', scope: 'organization' },
    { resource: 'report', action: 'export', scope: 'organization' },
    // 看板权限
    { resource: 'dashboard', action: 'read', scope: 'organization' },
  ],
  AUDITOR: [
    // 项目查看权限
    { resource: 'project', action: 'read', scope: 'organization' },
    { resource: 'subProject', action: 'read', scope: 'organization' },
    // 审核权限
    { resource: 'record', action: 'read', scope: 'organization' },
    { resource: 'record', action: 'audit', scope: 'organization' },
    // 报表权限
    { resource: 'report', action: 'read', scope: 'organization' },
    { resource: 'report', action: 'export', scope: 'organization' },
    // 看板权限
    { resource: 'dashboard', action: 'read', scope: 'organization' },
  ],
  OBSERVER: [
    // 只读权限
    { resource: 'project', action: 'read', scope: 'organization' },
    { resource: 'subProject', action: 'read', scope: 'organization' },
    { resource: 'record', action: 'read', scope: 'organization' },
    { resource: 'report', action: 'read', scope: 'organization' },
    { resource: 'report', action: 'export', scope: 'organization' },
    { resource: 'dashboard', action: 'read', scope: 'organization' },
  ],
}

// 用户会话信息
export interface Session {
  user: {
    id: string
    name: string
    email: string
    role: Role
    organizationId: string | null
    departmentId?: string | null
  }
} 