import { Permission } from './types';
import { prisma } from '../prisma';

export interface AuditLog {
  userId: string;
  action: 'check' | 'grant' | 'revoke' | 'error';
  resource: string;
  resourceId?: string;
  permissions?: Permission[];
  result: boolean;
  error?: string;
  duration?: number;
  timestamp: Date;
}

export class PermissionAudit {
  // 记录权限检查日志
  static async logCheck(params: {
    userId: string;
    resource: string;
    resourceId?: string;
    permissions: Permission[];
    result: boolean;
    error?: string;
    duration: number;
  }): Promise<void> {
    await this.createLog({
      ...params,
      action: 'check',
      timestamp: new Date(),
    });
  }

  // 记录权限授予日志
  static async logGrant(params: {
    userId: string;
    resource: string;
    resourceId?: string;
    permissions: Permission[];
  }): Promise<void> {
    await this.createLog({
      ...params,
      action: 'grant',
      result: true,
      timestamp: new Date(),
    });
  }

  // 记录权限撤销日志
  static async logRevoke(params: {
    userId: string;
    resource: string;
    resourceId?: string;
    permissions: Permission[];
  }): Promise<void> {
    await this.createLog({
      ...params,
      action: 'revoke',
      result: true,
      timestamp: new Date(),
    });
  }

  // 记录权限错误日志
  static async logError(params: {
    userId: string;
    resource: string;
    resourceId?: string;
    error: string;
  }): Promise<void> {
    await this.createLog({
      ...params,
      action: 'error',
      result: false,
      timestamp: new Date(),
    });
  }

  // 创建日志记录
  private static async createLog(log: AuditLog): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: log.userId,
          action: log.action,
          resource: log.resource,
          resourceId: log.resourceId,
          permissions: log.permissions ? JSON.stringify(log.permissions) : null,
          result: log.result,
          error: log.error,
          duration: log.duration,
          timestamp: log.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
    }
  }

  // 查询审计日志
  static async queryLogs(params: {
    userId?: string;
    action?: string;
    resource?: string;
    startTime?: Date;
    endTime?: Date;
    page?: number;
    pageSize?: number;
  }) {
    const { page = 1, pageSize = 20 } = params;
    
    const where = {
      ...(params.userId && { userId: params.userId }),
      ...(params.action && { action: params.action }),
      ...(params.resource && { resource: params.resource }),
      ...(params.startTime && params.endTime && {
        timestamp: {
          gte: params.startTime,
          lte: params.endTime,
        },
      }),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      total,
      logs,
      page,
      pageSize,
    };
  }
} 