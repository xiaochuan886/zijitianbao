import { describe, expect, test, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { AuditLogTimeline } from '@/components/organizations/AuditLogTimeline';

describe('审计日志时间线测试', () => {
  const mockLogs = [
    {
      id: '1',
      action: 'CREATE',
      target: 'organization',
      targetId: '1',
      details: {
        name: '测试机构',
        code: 'TEST001',
      },
      createdAt: new Date().toISOString(),
      user: {
        id: '1',
        name: '管理员',
      },
    },
    {
      id: '2',
      action: 'UPDATE',
      target: 'organization',
      targetId: '1',
      details: {
        name: '更新后的机构名称',
      },
      createdAt: new Date().toISOString(),
      user: {
        id: '1',
        name: '管理员',
      },
    },
  ];

  const mockActions = {
    CREATE: '创建',
    UPDATE: '更新',
    DELETE: '删除',
  };

  test('应该正确渲染操作日志列表', () => {
    render(
      <AuditLogTimeline
        logs={mockLogs}
        actions={mockActions}
      />
    );

    // 验证日志内容是否正确显示
    expect(screen.getByText('创建')).toBeInTheDocument();
    expect(screen.getByText('更新')).toBeInTheDocument();
    expect(screen.getByText('测试机构')).toBeInTheDocument();
    expect(screen.getByText('更新后的机构名称')).toBeInTheDocument();
    expect(screen.getAllByText('管理员')).toHaveLength(2);
  });

  test('应该正确处理空日志列表', () => {
    render(
      <AuditLogTimeline
        logs={[]}
        actions={mockActions}
      />
    );

    expect(screen.getByText('暂无操作记录')).toBeInTheDocument();
  });
}); 