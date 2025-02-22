# 测试计划文档
**版本**: 1.0
**更新日期**: 2024-08-25

## 一、测试范围

### 1. 单元测试
- 工具函数测试
- Hook测试
- 组件测试

### 2. 集成测试
- API接口测试
- 数据流测试
- 权限测试

### 3. E2E测试
- 关键业务流程测试
- 用户界面测试
- 性能测试

## 二、测试用例

### 1. 认证模块测试
```typescript
describe('认证模块', () => {
  describe('登录功能', () => {
    test('正确的用户名和密码应该登录成功', async () => {
      const response = await login({
        username: 'test',
        password: 'password'
      });
      expect(response.status).toBe(200);
      expect(response.data.token).toBeDefined();
    });

    test('错误的密码应该登录失败', async () => {
      const response = await login({
        username: 'test',
        password: 'wrong'
      });
      expect(response.status).toBe(401);
    });

    test('连续失败5次应该锁定账户', async () => {
      for (let i = 0; i < 5; i++) {
        await login({
          username: 'test',
          password: 'wrong'
        });
      }
      const response = await login({
        username: 'test',
        password: 'password'
      });
      expect(response.status).toBe(403);
      expect(response.data.message).toContain('账户已锁定');
    });
  });
});
```

### 2. 机构管理测试
```typescript
describe('机构管理', () => {
  describe('创建机构', () => {
    test('管理员应该能够创建机构', async () => {
      const org = {
        name: '测试机构',
        code: 'TEST001',
        departments: [
          { name: '部门1' },
          { name: '部门2' }
        ]
      };
      const response = await createOrganization(org);
      expect(response.status).toBe(200);
      expect(response.data.id).toBeDefined();
    });

    test('普通用户不能创建机构', async () => {
      const response = await createOrganization({
        name: '测试机构',
        code: 'TEST002'
      });
      expect(response.status).toBe(403);
    });

    test('机构编码不能重复', async () => {
      const org = {
        name: '测试机构2',
        code: 'TEST001'
      };
      const response = await createOrganization(org);
      expect(response.status).toBe(400);
      expect(response.data.message).toContain('编码已存在');
    });
  });
});
```

### 3. 资金填报测试
```typescript
describe('资金填报流程', () => {
  describe('需求预测填报', () => {
    test('填报人能够提交预测数据', async () => {
      const data = {
        records: [
          {
            subProjectId: '1',
            year: 2024,
            month: 3,
            amount: 10000
          }
        ]
      };
      const response = await submitPrediction(data);
      expect(response.status).toBe(200);
    });

    test('不能填报过去的月份', async () => {
      const data = {
        records: [
          {
            subProjectId: '1',
            year: 2023,
            month: 12,
            amount: 10000
          }
        ]
      };
      const response = await submitPrediction(data);
      expect(response.status).toBe(400);
    });

    test('金额不能为负数', async () => {
      const data = {
        records: [
          {
            subProjectId: '1',
            year: 2024,
            month: 3,
            amount: -1000
          }
        ]
      };
      const response = await submitPrediction(data);
      expect(response.status).toBe(400);
    });
  });

  describe('实际支付填报', () => {
    test('双重填报流程', async () => {
      // 填报人提交
      const userSubmit = await submitActual({
        records: [
          {
            subProjectId: '1',
            year: 2024,
            month: 2,
            amount: 10000,
            type: 'user'
          }
        ]
      });
      expect(userSubmit.status).toBe(200);

      // 财务提交
      const financeSubmit = await submitActual({
        records: [
          {
            subProjectId: '1',
            year: 2024,
            month: 2,
            amount: 10000,
            type: 'finance'
          }
        ]
      });
      expect(financeSubmit.status).toBe(200);

      // 审核
      const audit = await auditRecords({
        recordIds: [userSubmit.data.id],
        action: 'approve'
      });
      expect(audit.status).toBe(200);
    });
  });
});
```

### 4. 数据分析测试
```typescript
describe('数据分析功能', () => {
  describe('数据查询', () => {
    test('按维度聚合数据', async () => {
      const query = {
        dimensions: ['organization', 'year', 'month'],
        metrics: ['amount'],
        filters: [
          {
            field: 'year',
            operator: 'eq',
            value: 2024
          }
        ],
        sorting: [
          {
            field: 'amount',
            order: 'desc'
          }
        ],
        pagination: {
          page: 1,
          pageSize: 10
        }
      };
      const response = await queryData(query);
      expect(response.status).toBe(200);
      expect(response.data.items).toHaveLength(10);
    });

    test('导出数据', async () => {
      const query = {
        dimensions: ['organization', 'project'],
        metrics: ['amount'],
        filters: []
      };
      const response = await exportData(query);
      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toBe('application/vnd.ms-excel');
    });
  });
});
```

### 5. UI组件测试
```typescript
describe('UI组件测试', () => {
  describe('DataTable组件', () => {
    test('渲染表格数据', () => {
      const data = [
        { id: 1, name: '项目1' },
        { id: 2, name: '项目2' }
      ];
      const { container } = render(<DataTable data={data} />);
      expect(container.querySelectorAll('tr')).toHaveLength(3); // 包含表头
    });

    test('分页功能', async () => {
      const { getByText } = render(<DataTable data={data} />);
      const nextButton = getByText('下一页');
      await userEvent.click(nextButton);
      expect(getByText('第 2 页')).toBeInTheDocument();
    });

    test('排序功能', async () => {
      const { getByText } = render(<DataTable data={data} />);
      const nameHeader = getByText('名称');
      await userEvent.click(nameHeader);
      expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
    });
  });
});
```

## 三、测试环境配置

### 1. Jest配置
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts'
  ]
};
```

### 2. Cypress配置
```javascript
// cypress.config.ts
import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.ts'
  }
});
```

## 四、测试流程

### 1. 开发流程中的测试
1. 编写单元测试
2. 运行测试套件
3. 代码提交前确保测试通过
4. 定期进行集成测试

### 2. CI/CD中的测试
1. 提交触发自动测试
2. 测试失败阻止合并
3. 定期运行E2E测试
4. 生成测试报告

## 五、测试覆盖率要求

### 1. 覆盖率目标
- 单元测试: > 80%
- 集成测试: > 70%
- E2E测试: 关键流程100%

### 2. 重点测试领域
- 用户认证流程
- 数据填报流程
- 财务审核流程
- 数据分析功能

## 六、性能测试

### 1. 负载测试
- 并发用户数: 100
- 响应时间: < 2s
- 错误率: < 1%

### 2. 压力测试
- 极限并发: 500
- 数据量: 100万条
- 持续时间: 1小时 