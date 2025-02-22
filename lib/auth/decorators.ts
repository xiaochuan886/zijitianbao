import { Permission, Session } from './types'
import { checkPermission } from './permission'
import { ServiceError } from '../services/types'

export function requirePermission(permission: Permission) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      // 获取会话信息（假设第一个参数是会话）
      const session = args[0] as Session
      if (!session?.user) {
        throw new ServiceError(401, '未登录')
      }

      // 获取资源ID（如果有）
      const resourceId = args[1]?.id

      // 检查权限
      const hasPermission = await checkPermission(
        session,
        permission,
        resourceId
      )

      if (!hasPermission) {
        throw new ServiceError(403, '权限不足')
      }

      // 调用原始方法
      return originalMethod.apply(this, args)
    }

    return descriptor
  }
}

// 使用示例：
/*
class RecordService {
  @requirePermission({ resource: 'record', action: 'create', scope: 'self' })
  async create(session: Session, data: CreateRecordDto) {
    // 实现创建逻辑
  }
}
*/ 