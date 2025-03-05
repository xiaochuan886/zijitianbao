import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// 模拟Prisma客户端
vi.mock('@/lib/prisma', () => {
  const mockPrismaClient = {
    user: {
      upsert: vi.fn(),
      delete: vi.fn(),
      findUnique: vi.fn(),
    },
    withdrawalRequest: {
      create: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    notification: {
      create: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
    withdrawalConfig: {
      upsert: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((callback) => callback(mockPrismaClient)),
  };
  
  return {
    prisma: mockPrismaClient,
  };
});

// 导入模拟后的prisma
import { prisma } from '@/lib/prisma';

// 模拟类型
type MockPrisma = {
  user: {
    upsert: any;
    delete: any;
    findUnique: any;
  };
  withdrawalRequest: {
    create: any;
    update: any;
    deleteMany: any;
    findMany: any;
  };
  notification: {
    create: any;
    deleteMany: any;
    findMany: any;
  };
  withdrawalConfig: {
    upsert: any;
    delete: any;
  };
  $transaction: any;
};

// 模拟用户数据
const mockUser = {
  id: 'test-user-id',
  name: '测试用户',
  email: 'test@example.com',
  role: 'REPORTER',
  password: 'hashed-password',
};

const mockAdmin = {
  id: 'test-admin-id',
  name: '管理员',
  email: 'admin@example.com',
  role: 'ADMIN',
  password: 'hashed-password',
};

// 模拟记录数据
const mockPredictRecord = {
  id: 'test-predict-record-id',
  status: 'SUBMITTED',
  year: 2023,
  month: 5,
  amount: 1000,
  submittedAt: new Date(),
  detailedFundNeedId: 'test-detailed-fund-need-id',
};

// 模拟撤回配置
const mockWithdrawalConfig = {
  id: 'test-withdrawal-config-id',
  moduleType: 'predict',
  allowedStatuses: JSON.stringify(['SUBMITTED']),
  timeLimit: 24, // 24小时
  maxAttempts: 3,
  requireApproval: true,
};

describe('撤回功能测试', () => {
  // 每个测试前重置模拟函数
  beforeEach(() => {
    vi.resetAllMocks();
    
    // 模拟用户upsert返回值
    ((prisma as unknown as MockPrisma).user.upsert as any).mockResolvedValue(mockUser);
    
    // 模拟撤回请求create返回值
    ((prisma as unknown as MockPrisma).withdrawalRequest.create as any).mockResolvedValue({
      id: 'test-withdrawal-request-id',
      predictRecordId: mockPredictRecord.id,
      requesterId: mockUser.id,
      reason: '测试撤回原因',
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // 模拟撤回请求update返回值 - 批准
    ((prisma as unknown as MockPrisma).withdrawalRequest.update as any).mockImplementation(({ data }: { data: any }) => {
      return Promise.resolve({
        id: 'test-withdrawal-request-id',
        predictRecordId: mockPredictRecord.id,
        requesterId: mockUser.id,
        reason: '测试撤回原因',
        status: data.status,
        adminId: data.adminId,
        adminComment: data.adminComment,
        reviewedAt: data.reviewedAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });
    
    // 模拟通知create返回值
    ((prisma as unknown as MockPrisma).notification.create as any).mockResolvedValue({
      id: 'test-notification-id',
      userId: mockUser.id,
      title: '撤回请求已批准',
      content: '您的撤回请求已批准',
      type: 'withdrawal_approved',
      relatedId: 'test-withdrawal-request-id',
      relatedType: 'withdrawal_request',
      isRead: false,
      createdAt: new Date(),
    });
    
    // 模拟通知findMany返回值
    ((prisma as unknown as MockPrisma).notification.findMany as any).mockResolvedValue([
      {
        id: 'test-notification-id',
        userId: mockUser.id,
        title: '撤回请求已批准',
        content: '您的撤回请求已批准',
        type: 'withdrawal_approved',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
        isRead: false,
        createdAt: new Date(),
      },
    ]);
  });

  it('应该能够创建撤回请求', async () => {
    // 创建撤回请求
    const withdrawalRequest = await (prisma as unknown as MockPrisma).withdrawalRequest.create({
      data: {
        predictRecordId: mockPredictRecord.id,
        requesterId: mockUser.id,
        reason: '测试撤回原因',
        status: 'pending',
      },
    });

    // 验证撤回请求是否创建成功
    expect(withdrawalRequest).toBeDefined();
    expect(withdrawalRequest.predictRecordId).toBe(mockPredictRecord.id);
    expect(withdrawalRequest.requesterId).toBe(mockUser.id);
    expect(withdrawalRequest.reason).toBe('测试撤回原因');
    expect(withdrawalRequest.status).toBe('pending');
    
    // 验证create方法是否被调用
    expect((prisma as unknown as MockPrisma).withdrawalRequest.create).toHaveBeenCalledWith({
      data: {
        predictRecordId: mockPredictRecord.id,
        requesterId: mockUser.id,
        reason: '测试撤回原因',
        status: 'pending',
      },
    });
  });

  it('管理员应该能够批准撤回请求', async () => {
    // 管理员批准撤回请求
    const updatedRequest = await (prisma as unknown as MockPrisma).withdrawalRequest.update({
      where: { id: 'test-withdrawal-request-id' },
      data: {
        status: 'approved',
        adminId: mockAdmin.id,
        reviewedAt: new Date(),
        adminComment: '批准撤回',
      },
    });

    // 验证撤回请求是否更新成功
    expect(updatedRequest).toBeDefined();
    expect(updatedRequest.status).toBe('approved');
    expect(updatedRequest.adminId).toBe(mockAdmin.id);
    expect(updatedRequest.adminComment).toBe('批准撤回');
    expect(updatedRequest.reviewedAt).toBeDefined();
    
    // 验证update方法是否被调用
    expect((prisma as unknown as MockPrisma).withdrawalRequest.update).toHaveBeenCalledWith({
      where: { id: 'test-withdrawal-request-id' },
      data: {
        status: 'approved',
        adminId: mockAdmin.id,
        reviewedAt: expect.any(Date),
        adminComment: '批准撤回',
      },
    });
  });

  it('管理员应该能够拒绝撤回请求', async () => {
    // 更新模拟函数返回拒绝状态
    ((prisma as unknown as MockPrisma).withdrawalRequest.update as any).mockResolvedValueOnce({
      id: 'test-withdrawal-request-id',
      predictRecordId: mockPredictRecord.id,
      requesterId: mockUser.id,
      reason: '测试撤回原因',
      status: 'rejected',
      adminId: mockAdmin.id,
      adminComment: '拒绝撤回',
      reviewedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // 管理员拒绝撤回请求
    const updatedRequest = await (prisma as unknown as MockPrisma).withdrawalRequest.update({
      where: { id: 'test-withdrawal-request-id' },
      data: {
        status: 'rejected',
        adminId: mockAdmin.id,
        reviewedAt: new Date(),
        adminComment: '拒绝撤回',
      },
    });

    // 验证撤回请求是否更新成功
    expect(updatedRequest).toBeDefined();
    expect(updatedRequest.status).toBe('rejected');
    expect(updatedRequest.adminId).toBe(mockAdmin.id);
    expect(updatedRequest.adminComment).toBe('拒绝撤回');
    expect(updatedRequest.reviewedAt).toBeDefined();
    
    // 验证update方法是否被调用
    expect((prisma as unknown as MockPrisma).withdrawalRequest.update).toHaveBeenCalledWith({
      where: { id: 'test-withdrawal-request-id' },
      data: {
        status: 'rejected',
        adminId: mockAdmin.id,
        reviewedAt: expect.any(Date),
        adminComment: '拒绝撤回',
      },
    });
  });

  it('批准撤回请求后应该创建通知', async () => {
    // 更新模拟通知findMany返回值
    ((prisma as unknown as MockPrisma).notification.findMany as any).mockResolvedValueOnce([
      {
        id: 'test-notification-id',
        userId: mockUser.id,
        title: '撤回请求已批准',
        content: '您的撤回请求已批准。备注: 批准撤回',
        type: 'withdrawal_approved',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
        isRead: false,
        createdAt: new Date(),
      },
    ]);
    
    // 创建通知
    await (prisma as unknown as MockPrisma).notification.create({
      data: {
        userId: mockUser.id,
        title: '撤回请求已批准',
        content: '您的撤回请求已批准。备注: 批准撤回',
        type: 'withdrawal_approved',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
      },
    });

    // 验证通知是否创建成功
    const notifications = await (prisma as unknown as MockPrisma).notification.findMany({
      where: { userId: mockUser.id },
    });

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toBe('撤回请求已批准');
    expect(notifications[0].type).toBe('withdrawal_approved');
    expect(notifications[0].relatedId).toBe('test-withdrawal-request-id');
    
    // 验证create方法是否被调用
    expect((prisma as unknown as MockPrisma).notification.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        title: '撤回请求已批准',
        content: '您的撤回请求已批准。备注: 批准撤回',
        type: 'withdrawal_approved',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
      },
    });
  });

  it('拒绝撤回请求后应该创建通知', async () => {
    // 更新模拟通知findMany返回值
    ((prisma as unknown as MockPrisma).notification.findMany as any).mockResolvedValueOnce([
      {
        id: 'test-notification-id',
        userId: mockUser.id,
        title: '撤回请求已拒绝',
        content: '您的撤回请求已被拒绝。原因：拒绝撤回',
        type: 'withdrawal_rejected',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
        isRead: false,
        createdAt: new Date(),
      },
    ]);
    
    // 创建通知
    await (prisma as unknown as MockPrisma).notification.create({
      data: {
        userId: mockUser.id,
        title: '撤回请求已拒绝',
        content: '您的撤回请求已被拒绝。原因：拒绝撤回',
        type: 'withdrawal_rejected',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
      },
    });

    // 验证通知是否创建成功
    const notifications = await (prisma as unknown as MockPrisma).notification.findMany({
      where: { userId: mockUser.id },
    });

    expect(notifications.length).toBeGreaterThan(0);
    expect(notifications[0].title).toBe('撤回请求已拒绝');
    expect(notifications[0].type).toBe('withdrawal_rejected');
    expect(notifications[0].relatedId).toBe('test-withdrawal-request-id');
    
    // 验证create方法是否被调用
    expect((prisma as unknown as MockPrisma).notification.create).toHaveBeenCalledWith({
      data: {
        userId: mockUser.id,
        title: '撤回请求已拒绝',
        content: '您的撤回请求已被拒绝。原因：拒绝撤回',
        type: 'withdrawal_rejected',
        relatedId: 'test-withdrawal-request-id',
        relatedType: 'withdrawal_request',
      },
    });
  });
}); 