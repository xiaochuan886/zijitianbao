import { Session, Permission, ROLE_PERMISSIONS } from './types'
import { prisma } from '../prisma'
import { ServiceError } from '../services/types'

// 定义基本类型接口
interface BaseEntity {
  id: string
}

interface Organization extends BaseEntity {
  name: string
  code: string
  organizationId?: string
}

interface Department extends BaseEntity {
  name: string
  organizationId: string
}

export async function checkPermission(
  session: Session | null,
  required: Permission,
  resourceId?: string
): Promise<boolean> {
  // 未登录用户没有任何权限
  if (!session?.user) {
    return false
  }

  const userRole = session.user.role
  const userPermissions = ROLE_PERMISSIONS[userRole]

  // 查找匹配的权限
  const matchedPermission = userPermissions.find(
    (p) => p.resource === required.resource && p.action === required.action
  )

  if (!matchedPermission) {
    return false
  }

  // 检查权限范围
  switch (matchedPermission.scope) {
    case 'all':
      return true

    case 'organization':
      if (!session.user.organizationId) {
        return false
      }
      if (!resourceId) {
        return true
      }
      // 检查资源是否属于用户所在机构
      return await checkResourceOrganization(
        required.resource,
        resourceId,
        session.user.organizationId
      )

    case 'department':
      if (!session.user.departmentId) {
        return false
      }
      if (!resourceId) {
        return true
      }
      // 检查资源是否属于用户所在部门
      return await checkResourceDepartment(
        required.resource,
        resourceId,
        session.user.departmentId
      )

    case 'self':
      if (!resourceId) {
        return true
      }
      // 检查资源是否属于用户本人
      return await checkResourceOwnership(
        required.resource,
        resourceId,
        session.user.id
      )

    default:
      return false
  }
}

async function checkResourceOrganization(
  resource: string,
  resourceId: string,
  organizationId: string
): Promise<boolean> {
  try {
    switch (resource) {
      case 'record':
        const record = await prisma.record.findUnique({
          where: { id: resourceId },
          include: {
            subProject: {
              include: {
                project: {
                  include: {
                    organizations: true,
                  },
                },
              },
            },
          },
        })
        return record?.subProject.project.organizations.some(
          (org: Organization) => org.id === organizationId
        ) ?? false

      case 'project':
        const project = await prisma.project.findUnique({
          where: { id: resourceId },
          include: {
            organizations: true,
          },
        })
        return project?.organizations.some(
          (org: Organization) => org.id === organizationId
        ) ?? false

      case 'department':
        const department = await prisma.department.findUnique({
          where: { id: resourceId },
        })
        return department?.organizationId === organizationId

      case 'user':
        const user = await prisma.user.findUnique({
          where: { id: resourceId },
        })
        return user?.organizationId === organizationId

      default:
        return false
    }
  } catch (error) {
    console.error('[权限检查] 检查机构权限出错:', error)
    return false
  }
}

async function checkResourceDepartment(
  resource: string,
  resourceId: string,
  departmentId: string
): Promise<boolean> {
  try {
    switch (resource) {
      case 'project':
        const project = await prisma.project.findUnique({
          where: { id: resourceId },
          include: {
            departments: true,
          },
        })
        return project?.departments.some(
          (dept: Department) => dept.id === departmentId
        ) ?? false

      case 'record':
        const record = await prisma.record.findUnique({
          where: { id: resourceId },
          include: {
            subProject: {
              include: {
                project: {
                  include: {
                    departments: true,
                  },
                },
              },
            },
          },
        })
        return record?.subProject.project.departments.some(
          (dept: Department) => dept.id === departmentId
        ) ?? false

      default:
        return false
    }
  } catch (error) {
    console.error('[权限检查] 检查部门权限出错:', error)
    return false
  }
}

async function checkResourceOwnership(
  resource: string,
  resourceId: string,
  userId: string
): Promise<boolean> {
  try {
    switch (resource) {
      case 'record':
        const record = await prisma.record.findUnique({
          where: { id: resourceId },
        })
        return record?.submittedBy === userId

      case 'report':
      case 'dashboard':
        // 检查报表和看板的创建者
        const item = await prisma[resource].findUnique({
          where: { id: resourceId },
        })
        return item?.createdBy === userId

      default:
        return false
    }
  } catch (error) {
    console.error('[权限检查] 检查所有权出错:', error)
    return false
  }
} 