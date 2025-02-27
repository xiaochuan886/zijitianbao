-- 添加新的状态字段到Record表
ALTER TABLE "Record" ADD COLUMN "predictUserStatus" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Record" ADD COLUMN "actualUserStatus" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Record" ADD COLUMN "actualFinanceStatus" TEXT NOT NULL DEFAULT 'draft';
ALTER TABLE "Record" ADD COLUMN "auditFinanceStatus" TEXT NOT NULL DEFAULT 'draft';

-- 创建RecordAudit表
CREATE TABLE "RecordAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "recordId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValue" TEXT,
    "newValue" TEXT,
    "role" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecordAudit_recordId_fkey" FOREIGN KEY ("recordId") REFERENCES "Record" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- 创建索引
CREATE INDEX "RecordAudit_recordId_idx" ON "RecordAudit"("recordId");
CREATE INDEX "RecordAudit_userId_idx" ON "RecordAudit"("userId");
CREATE INDEX "RecordAudit_action_idx" ON "RecordAudit"("action");
CREATE INDEX "RecordAudit_timestamp_idx" ON "RecordAudit"("timestamp");
CREATE INDEX "RecordAudit_role_idx" ON "RecordAudit"("role");

-- 为Record表添加新的索引
CREATE INDEX "Record_predictUserStatus_idx" ON "Record"("predictUserStatus");
CREATE INDEX "Record_actualUserStatus_idx" ON "Record"("actualUserStatus");
CREATE INDEX "Record_actualFinanceStatus_idx" ON "Record"("actualFinanceStatus");
CREATE INDEX "Record_auditFinanceStatus_idx" ON "Record"("auditFinanceStatus");

-- 数据迁移：将现有status值复制到对应的新状态字段
UPDATE "Record" SET 
    "predictUserStatus" = "status",
    "actualUserStatus" = "status",
    "actualFinanceStatus" = "status",
    "auditFinanceStatus" = "status"
WHERE "status" IS NOT NULL; 