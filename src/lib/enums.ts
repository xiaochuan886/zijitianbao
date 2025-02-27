// 角色枚举
export enum Role {
  ADMIN = "ADMIN",
  REPORTER = "REPORTER",
  FINANCE = "FINANCE",
  AUDITOR = "AUDITOR",
  OBSERVER = "OBSERVER"
}

// 项目状态枚举
export enum ProjectStatus {
  ACTIVE = "ACTIVE",
  ARCHIVED = "ARCHIVED"
}

// 记录状态枚举
export enum RecordStatus {
  DRAFT = "draft",
  SUBMITTED = "submitted",
  PENDING_WITHDRAWAL = "pending_withdrawal"
} 