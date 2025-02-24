import { Permission, ROLE_PERMISSIONS, Role } from './types';
import { LRUCache } from 'lru-cache';

// 权限缓存配置
const CACHE_CONFIG = {
  // 最大缓存项数
  max: 500,
  // 缓存时间 (1小时)
  ttl: 1000 * 60 * 60,
};

// 用户权限缓存
const userPermissionCache = new LRUCache<string, Permission[]>(CACHE_CONFIG);

// 角色权限缓存
const rolePermissionCache = new LRUCache<Role, Permission[]>(CACHE_CONFIG);

export class PermissionCache {
  // 获取用户权限
  static getUserPermissions(userId: string): Permission[] | undefined {
    return userPermissionCache.get(userId);
  }

  // 设置用户权限
  static setUserPermissions(userId: string, permissions: Permission[]): void {
    userPermissionCache.set(userId, permissions);
  }

  // 获取角色权限
  static getRolePermissions(role: Role): Permission[] {
    const cached = rolePermissionCache.get(role);
    if (cached) {
      return cached;
    }
    
    // 如果缓存未命中，从配置中获取并缓存
    const permissions = ROLE_PERMISSIONS[role];
    rolePermissionCache.set(role, permissions);
    return permissions;
  }

  // 清除用户权限缓存
  static clearUserPermissions(userId: string): void {
    userPermissionCache.delete(userId);
  }

  // 清除所有缓存
  static clearAll(): void {
    userPermissionCache.clear();
    rolePermissionCache.clear();
  }

  // 获取缓存统计信息
  static getStats() {
    return {
      userPermissions: {
        size: userPermissionCache.size,
        hits: userPermissionCache.hits,
        misses: userPermissionCache.misses,
      },
      rolePermissions: {
        size: rolePermissionCache.size,
        hits: rolePermissionCache.hits,
        misses: rolePermissionCache.misses,
      },
    };
  }
} 