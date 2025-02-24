import { PermissionCache } from './cache';

interface PerformanceMetrics {
  totalChecks: number;
  totalDuration: number;
  averageDuration: number;
  maxDuration: number;
  minDuration: number;
  errorCount: number;
  lastReset: Date;
}

export class PermissionMonitor {
  private static metrics: PerformanceMetrics = {
    totalChecks: 0,
    totalDuration: 0,
    averageDuration: 0,
    maxDuration: 0,
    minDuration: Infinity,
    errorCount: 0,
    lastReset: new Date(),
  };

  // 记录权限检查性能
  static recordCheck(duration: number, hasError: boolean = false): void {
    this.metrics.totalChecks++;
    this.metrics.totalDuration += duration;
    this.metrics.averageDuration = this.metrics.totalDuration / this.metrics.totalChecks;
    this.metrics.maxDuration = Math.max(this.metrics.maxDuration, duration);
    this.metrics.minDuration = Math.min(this.metrics.minDuration, duration);
    
    if (hasError) {
      this.metrics.errorCount++;
    }
  }

  // 获取性能指标
  static getMetrics(): PerformanceMetrics & {
    cacheStats: ReturnType<typeof PermissionCache.getStats>;
  } {
    return {
      ...this.metrics,
      cacheStats: PermissionCache.getStats(),
    };
  }

  // 重置性能指标
  static resetMetrics(): void {
    this.metrics = {
      totalChecks: 0,
      totalDuration: 0,
      averageDuration: 0,
      maxDuration: 0,
      minDuration: Infinity,
      errorCount: 0,
      lastReset: new Date(),
    };
  }

  // 计算缓存命中率
  static getCacheHitRate(): {
    userPermissions: number;
    rolePermissions: number;
  } {
    const stats = PermissionCache.getStats();
    
    const calculateHitRate = (hits: number, total: number) => {
      return total === 0 ? 0 : (hits / total) * 100;
    };

    return {
      userPermissions: calculateHitRate(
        stats.userPermissions.hits,
        stats.userPermissions.hits + stats.userPermissions.misses
      ),
      rolePermissions: calculateHitRate(
        stats.rolePermissions.hits,
        stats.rolePermissions.hits + stats.rolePermissions.misses
      ),
    };
  }

  // 生成性能报告
  static generateReport(): string {
    const metrics = this.getMetrics();
    const hitRates = this.getCacheHitRate();

    return `
权限系统性能报告
================
生成时间: ${new Date().toISOString()}
上次重置: ${metrics.lastReset.toISOString()}

检查性能
--------
总检查次数: ${metrics.totalChecks}
平均耗时: ${metrics.averageDuration.toFixed(2)}ms
最大耗时: ${metrics.maxDuration}ms
最小耗时: ${metrics.minDuration === Infinity ? 'N/A' : metrics.minDuration + 'ms'}
错误次数: ${metrics.errorCount}
错误率: ${((metrics.errorCount / metrics.totalChecks) * 100).toFixed(2)}%

缓存性能
--------
用户权限缓存:
- 缓存项数: ${metrics.cacheStats.userPermissions.size}
- 命中率: ${hitRates.userPermissions.toFixed(2)}%

角色权限缓存:
- 缓存项数: ${metrics.cacheStats.rolePermissions.size}
- 命中率: ${hitRates.rolePermissions.toFixed(2)}%
    `.trim();
  }
} 