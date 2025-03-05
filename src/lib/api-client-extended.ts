import { apiClient } from './api-client';
import { ApiBase } from './api-base';

/**
 * 撤回配置API客户端
 */
class WithdrawalConfigApi extends ApiBase {
  /**
   * 获取撤回配置列表
   */
  async list() {
    return this.get('/withdrawal-config');
  }

  /**
   * 获取特定模块的撤回配置
   */
  async getByModule(moduleType: string) {
    return this.get(`/withdrawal-config/${moduleType}`);
  }

  /**
   * 创建或更新撤回配置
   */
  async save(data: {
    id?: string;
    moduleType: string;
    allowedStatuses: string;
    timeLimit: number;
    maxAttempts: number;
    requireApproval: boolean;
  }) {
    return this.post('/withdrawal-config', data);
  }
}

/**
 * 撤回请求API客户端
 */
class WithdrawalRequestApi extends ApiBase {
  /**
   * 获取撤回请求列表
   */
  async list(params: { 
    page?: number; 
    pageSize?: number; 
    status?: string;
    moduleType?: string;
  } = {}) {
    const { page = 1, pageSize = 10, status, moduleType } = params;
    return this.get('/withdrawal-request', { page, pageSize, status, moduleType });
  }

  /**
   * 创建撤回请求
   */
  async create(data: {
    recordId: string;
    recordType: string;
    reason: string;
  }) {
    return this.post('/withdrawal-request', data);
  }

  /**
   * 审批撤回请求
   */
  async review(id: string, data: {
    action: 'approve' | 'reject';
    comment?: string;
  }) {
    return this.put(`/withdrawal-request/${id}`, data);
  }

  /**
   * 检查记录是否可以撤回
   */
  async checkEligibility(recordId: string, recordType: string) {
    return this.get(`/withdrawal-request/check-eligibility`, { recordId, recordType });
  }
}

/**
 * 通知API客户端
 */
class NotificationApi extends ApiBase {
  /**
   * 获取用户通知列表
   */
  async list(params: { page?: number; pageSize?: number; isRead?: boolean } = {}) {
    const { page = 1, pageSize = 10, isRead } = params;
    return this.get('/notifications', { page, pageSize, isRead });
  }

  /**
   * 标记通知为已读
   */
  async markAsRead(id: string) {
    return this.put(`/notifications/${id}/read`, {});
  }

  /**
   * 标记所有通知为已读
   */
  async markAllAsRead() {
    return this.post('/notifications/read-all', {});
  }

  /**
   * 获取未读通知数量
   */
  async getUnreadCount() {
    return this.get('/notifications/unread-count');
  }
}

// 扩展API客户端
export const extendedApiClient = {
  ...apiClient,
  withdrawalConfig: new WithdrawalConfigApi(),
  withdrawalRequest: new WithdrawalRequestApi(),
  notifications: new NotificationApi(),
} 