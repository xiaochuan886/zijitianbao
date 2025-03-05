# 撤回功能 API 文档

本文档详细说明了资金计划填报系统中撤回功能的 API 接口和使用方法。

## 数据模型

### WithdrawalConfig 模型

撤回配置模型，用于定义不同模块的撤回规则。

```prisma
model WithdrawalConfig {
  id                String   @id @default(cuid())
  moduleType        String   // "predict", "actual_user", "actual_fin", "audit"
  allowedStatuses   String   // 允许撤回的状态列表，JSON字符串
  timeLimit         Int      // 撤回时间限制（小时）
  maxAttempts       Int      // 最大撤回次数
  requireApproval   Boolean  @default(true) // 是否需要管理员审批
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([moduleType])
}
```

### WithdrawalRequest 模型

撤回请求模型，用于记录用户的撤回申请。

```prisma
model WithdrawalRequest {
  id                 String            @id @default(cuid())
  predictRecordId    String?           
  actualUserRecordId String?           
  actualFinRecordId  String?           
  auditRecordId      String?           
  requesterId        String
  reason             String
  status             String            // "pending", "approved", "rejected"
  adminId            String?
  adminComment       String?
  reviewedAt         DateTime?
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  predictRecord      PredictRecord?    @relation("PredictWithdrawalRequests", fields: [predictRecordId], references: [id], onDelete: SetNull)
  actualUserRecord   ActualUserRecord? @relation("ActualUserWithdrawalRequests", fields: [actualUserRecordId], references: [id], onDelete: SetNull)
  actualFinRecord    ActualFinRecord?  @relation("ActualFinWithdrawalRequests", fields: [actualFinRecordId], references: [id], onDelete: SetNull)
  auditRecord        AuditRecord?      @relation("AuditWithdrawalRequests", fields: [auditRecordId], references: [id], onDelete: SetNull)
  requester          User              @relation("UserWithdrawalRequests", fields: [requesterId], references: [id])
  admin              User?             @relation("AdminWithdrawalRequests", fields: [adminId], references: [id])
}
```

## API 接口

### 1. 获取撤回请求列表

**请求**

```
GET /api/withdrawal-request
```

**查询参数**

- `page`: 页码，默认为 1
- `pageSize`: 每页数量，默认为 10
- `status`: 状态筛选，可选值为 "pending", "approved", "rejected"
- `moduleType`: 模块类型筛选，可选值为 "predict", "actual_user", "actual_fin", "audit"

**响应**

```json
{
  "success": true,
  "data": {
    "requests": [
      {
        "id": "cuid123",
        "predictRecordId": "cuid456",
        "requesterId": "cuid789",
        "reason": "数据填写错误，需要修改",
        "status": "pending",
        "createdAt": "2023-06-01T12:00:00Z",
        "requester": {
          "id": "cuid789",
          "name": "张三",
          "email": "zhangsan@example.com"
        },
        "predictRecord": {
          "id": "cuid456",
          "status": "PENDING_WITHDRAWAL",
          "year": 2023,
          "month": 6,
          "amount": 10000,
          "detailedFundNeed": {
            "id": "cuid101",
            "subProject": {
              "id": "cuid102",
              "name": "子项目A",
              "project": {
                "id": "cuid103",
                "name": "项目A"
              }
            }
          }
        }
      }
    ],
    "total": 5,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

### 2. 获取单个撤回请求详情

**请求**

```
GET /api/withdrawal-request/{id}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "predictRecordId": "cuid456",
    "requesterId": "cuid789",
    "reason": "数据填写错误，需要修改",
    "status": "pending",
    "createdAt": "2023-06-01T12:00:00Z",
    "requester": {
      "id": "cuid789",
      "name": "张三",
      "email": "zhangsan@example.com"
    },
    "predictRecord": {
      "id": "cuid456",
      "status": "PENDING_WITHDRAWAL",
      "year": 2023,
      "month": 6,
      "amount": 10000,
      "detailedFundNeed": {
        "id": "cuid101",
        "subProject": {
          "id": "cuid102",
          "name": "子项目A",
          "project": {
            "id": "cuid103",
            "name": "项目A"
          }
        }
      }
    }
  }
}
```

### 3. 创建撤回请求

**请求**

```
POST /api/withdrawal-request
```

**请求体**

```json
{
  "recordType": "predict",
  "recordId": "cuid456",
  "reason": "数据填写错误，需要修改"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "predictRecordId": "cuid456",
    "requesterId": "cuid789",
    "reason": "数据填写错误，需要修改",
    "status": "pending",
    "createdAt": "2023-06-01T12:00:00Z"
  }
}
```

**错误响应**

```json
{
  "success": false,
  "message": "错误信息",
  "error": {
    "type": "record_not_found" | "invalid_status" | "time_limit_exceeded" | "max_attempts_exceeded" | "already_pending"
  }
}
```

### 4. 审批撤回请求

**请求**

```
PUT /api/withdrawal-request/{id}
```

**请求体**

```json
{
  "status": "approved" | "rejected",
  "comment": "审批意见"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "cuid123",
    "status": "approved",
    "adminId": "cuid999",
    "adminComment": "审批意见",
    "reviewedAt": "2023-06-02T12:00:00Z"
  }
}
```

## 撤回配置 API

### 1. 获取撤回配置列表

**请求**

```
GET /api/withdrawal-config
```

**响应**

```json
{
  "success": true,
  "data": [
    {
      "id": "cuid201",
      "moduleType": "predict",
      "allowedStatuses": "[\"SUBMITTED\"]",
      "timeLimit": 24,
      "maxAttempts": 3,
      "requireApproval": true,
      "createdAt": "2023-06-01T12:00:00Z",
      "updatedAt": "2023-06-01T12:00:00Z"
    }
  ]
}
```

### 2. 创建或更新撤回配置

**请求**

```
POST /api/withdrawal-config
```

**请求体**

```json
{
  "moduleType": "predict",
  "allowedStatuses": ["SUBMITTED"],
  "timeLimit": 24,
  "maxAttempts": 3,
  "requireApproval": true
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "cuid201",
    "moduleType": "predict",
    "allowedStatuses": "[\"SUBMITTED\"]",
    "timeLimit": 24,
    "maxAttempts": 3,
    "requireApproval": true,
    "createdAt": "2023-06-01T12:00:00Z",
    "updatedAt": "2023-06-01T12:00:00Z"
  }
}
```

## 前端组件

### 1. 创建撤回请求按钮

```tsx
<CreateWithdrawalRequestButton
  recordType="predict"
  recordId="cuid456"
  onSuccess={() => {
    // 处理成功回调
  }}
/>
```

### 2. 撤回请求列表

```tsx
<WithdrawalRequestList />
```

### 3. 撤回请求详情

```tsx
<WithdrawalRequestDetail id="cuid123" />
```

## 使用流程

1. 用户在填报页面点击"申请撤回"按钮
2. 系统检查记录是否满足撤回条件（状态、时间限制、撤回次数）
3. 用户填写撤回原因并提交
4. 如果配置为不需要审批，系统直接将记录状态改为"已撤回"
5. 如果配置为需要审批，系统将记录状态改为"撤回审核中"，并向管理员发送通知
6. 管理员在撤回请求管理页面审批撤回请求
7. 审批通过后，系统将记录状态改为"已撤回"，并向用户发送通知
8. 审批拒绝后，系统将记录状态恢复为原状态，并向用户发送通知

## 错误处理

撤回请求可能会因为以下原因失败：

1. 记录不存在
2. 记录状态不允许撤回
3. 超过撤回时间限制
4. 超过最大撤回次数
5. 已有待处理的撤回请求

前端组件会根据API返回的错误类型显示相应的错误信息。 