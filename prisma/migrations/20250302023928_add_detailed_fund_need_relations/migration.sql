/*
  Warnings:

  - You are about to drop the `_DepartmentToProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FundTypeToSubProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectOrganizations` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `detailedFundNeedId` to the `ActualFinRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `ActualUserRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detailedFundNeedId` to the `ActualUserRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detailedFundNeedId` to the `AuditRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `departmentId` to the `PredictRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `detailedFundNeedId` to the `PredictRecord` table without a default value. This is not possible if the table is not empty.

*/
-- 首先检查表是否存在，然后再删除索引和表
SELECT CASE 
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='_DepartmentToProject') 
    THEN 'DROP INDEX "_DepartmentToProject_B_index";
         DROP INDEX "_DepartmentToProject_AB_unique";
         PRAGMA foreign_keys=off;
         DROP TABLE "_DepartmentToProject";
         PRAGMA foreign_keys=on;'
    ELSE 'SELECT 1;'
END;

SELECT CASE 
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='_FundTypeToSubProject') 
    THEN 'DROP INDEX "_FundTypeToSubProject_B_index";
         DROP INDEX "_FundTypeToSubProject_AB_unique";
         PRAGMA foreign_keys=off;
         DROP TABLE "_FundTypeToSubProject";
         PRAGMA foreign_keys=on;'
    ELSE 'SELECT 1;'
END;

SELECT CASE 
    WHEN EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='_ProjectOrganizations') 
    THEN 'DROP INDEX "_ProjectOrganizations_B_index";
         DROP INDEX "_ProjectOrganizations_AB_unique";
         PRAGMA foreign_keys=off;
         DROP TABLE "_ProjectOrganizations";
         PRAGMA foreign_keys=on;'
    ELSE 'SELECT 1;'
END;

-- CreateTable
CREATE TABLE "DetailedFundNeed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subProjectId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DetailedFundNeed_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetailedFundNeed_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetailedFundNeed_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DetailedFundNeed_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "UserDepartment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REPORTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserDepartment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 首先为每个记录创建DetailedFundNeed记录的函数，使用直接的关联，不再依赖于_DepartmentToProject表
CREATE TABLE DetailedFundNeedTemp AS 
SELECT 
    hex(randomblob(16)) as id,
    pr.subProjectId as subProjectId,
    (SELECT d.id FROM Department d ORDER BY d.id LIMIT 1) as departmentId,
    pr.fundTypeId as fundTypeId,
    (SELECT d.organizationId FROM Department d ORDER BY d.id LIMIT 1) as organizationId,
    1 as isActive,
    datetime('now') as createdAt,
    datetime('now') as updatedAt
FROM 
    PredictRecord pr
GROUP BY 
    pr.subProjectId, pr.fundTypeId;

-- 插入创建的DetailedFundNeed记录
INSERT INTO DetailedFundNeed 
SELECT 
    id, subProjectId, departmentId, fundTypeId, organizationId, 
    isActive, createdAt, updatedAt 
FROM DetailedFundNeedTemp;

-- 删除临时表
DROP TABLE DetailedFundNeedTemp;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActualFinRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL, -- 通过子查询设置默认值
    "subProjectId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "submittedBy" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userRecordId" TEXT,
    "departmentId" TEXT,
    CONSTRAINT "ActualFinRecord_detailedFundNeedId_fkey" FOREIGN KEY ("detailedFundNeedId") REFERENCES "DetailedFundNeed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_userRecordId_fkey" FOREIGN KEY ("userRecordId") REFERENCES "ActualUserRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 将现有数据复制到新表，为detailedFundNeedId字段找到合适的DetailedFundNeed记录
INSERT INTO "new_ActualFinRecord" 
SELECT 
    afr.id, 
    (SELECT dfn.id FROM DetailedFundNeed dfn WHERE dfn.subProjectId = afr.subProjectId AND dfn.fundTypeId = afr.fundTypeId LIMIT 1) as detailedFundNeedId,
    afr.subProjectId, 
    afr.fundTypeId, 
    afr.year, 
    afr.month, 
    afr.amount, 
    afr.status, 
    afr.remark, 
    afr.submittedBy, 
    afr.submittedAt, 
    afr.createdAt, 
    afr.updatedAt, 
    afr.userRecordId,
    (SELECT departmentId FROM DetailedFundNeed WHERE subProjectId = afr.subProjectId AND fundTypeId = afr.fundTypeId LIMIT 1) as departmentId
FROM "ActualFinRecord" afr;

DROP TABLE "ActualFinRecord";
ALTER TABLE "new_ActualFinRecord" RENAME TO "ActualFinRecord";
CREATE UNIQUE INDEX "ActualFinRecord_userRecordId_key" ON "ActualFinRecord"("userRecordId");
CREATE INDEX "ActualFinRecord_detailedFundNeedId_idx" ON "ActualFinRecord"("detailedFundNeedId");
CREATE INDEX "ActualFinRecord_subProjectId_idx" ON "ActualFinRecord"("subProjectId");
CREATE INDEX "ActualFinRecord_fundTypeId_idx" ON "ActualFinRecord"("fundTypeId");
CREATE INDEX "ActualFinRecord_year_idx" ON "ActualFinRecord"("year");
CREATE INDEX "ActualFinRecord_month_idx" ON "ActualFinRecord"("month");
CREATE INDEX "ActualFinRecord_status_idx" ON "ActualFinRecord"("status");
CREATE INDEX "ActualFinRecord_submittedBy_idx" ON "ActualFinRecord"("submittedBy");
CREATE INDEX "ActualFinRecord_submittedAt_idx" ON "ActualFinRecord"("submittedAt");
CREATE INDEX "ActualFinRecord_userRecordId_idx" ON "ActualFinRecord"("userRecordId");
CREATE UNIQUE INDEX "ActualFinRecord_detailedFundNeedId_year_month_key" ON "ActualFinRecord"("detailedFundNeedId", "year", "month");
CREATE UNIQUE INDEX "ActualFinRecord_subProjectId_fundTypeId_year_month_key" ON "ActualFinRecord"("subProjectId", "fundTypeId", "year", "month");

CREATE TABLE "new_ActualUserRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL, -- 通过子查询设置默认值
    "subProjectId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL, -- 通过子查询设置默认值
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "submittedBy" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ActualUserRecord_detailedFundNeedId_fkey" FOREIGN KEY ("detailedFundNeedId") REFERENCES "DetailedFundNeed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualUserRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualUserRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualUserRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualUserRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 将现有数据复制到新表，为detailedFundNeedId和departmentId字段找到合适的值
INSERT INTO "new_ActualUserRecord" 
SELECT 
    aur.id, 
    (SELECT dfn.id FROM DetailedFundNeed dfn WHERE dfn.subProjectId = aur.subProjectId AND dfn.fundTypeId = aur.fundTypeId LIMIT 1) as detailedFundNeedId,
    aur.subProjectId, 
    aur.fundTypeId, 
    (SELECT departmentId FROM DetailedFundNeed WHERE subProjectId = aur.subProjectId AND fundTypeId = aur.fundTypeId LIMIT 1) as departmentId,
    aur.year, 
    aur.month, 
    aur.amount, 
    aur.status, 
    aur.remark, 
    aur.submittedBy, 
    aur.submittedAt, 
    aur.createdAt, 
    aur.updatedAt
FROM "ActualUserRecord" aur;

DROP TABLE "ActualUserRecord";
ALTER TABLE "new_ActualUserRecord" RENAME TO "ActualUserRecord";
CREATE INDEX "ActualUserRecord_detailedFundNeedId_idx" ON "ActualUserRecord"("detailedFundNeedId");
CREATE INDEX "ActualUserRecord_departmentId_idx" ON "ActualUserRecord"("departmentId");
CREATE INDEX "ActualUserRecord_subProjectId_idx" ON "ActualUserRecord"("subProjectId");
CREATE INDEX "ActualUserRecord_fundTypeId_idx" ON "ActualUserRecord"("fundTypeId");
CREATE INDEX "ActualUserRecord_year_idx" ON "ActualUserRecord"("year");
CREATE INDEX "ActualUserRecord_month_idx" ON "ActualUserRecord"("month");
CREATE INDEX "ActualUserRecord_status_idx" ON "ActualUserRecord"("status");
CREATE INDEX "ActualUserRecord_submittedBy_idx" ON "ActualUserRecord"("submittedBy");
CREATE INDEX "ActualUserRecord_submittedAt_idx" ON "ActualUserRecord"("submittedAt");
CREATE UNIQUE INDEX "ActualUserRecord_detailedFundNeedId_year_month_key" ON "ActualUserRecord"("detailedFundNeedId", "year", "month");
CREATE UNIQUE INDEX "ActualUserRecord_subProjectId_fundTypeId_departmentId_year_month_key" ON "ActualUserRecord"("subProjectId", "fundTypeId", "departmentId", "year", "month");

CREATE TABLE "new_AuditRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL, -- 通过子查询设置默认值
    "subProjectId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "submittedBy" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "financeRecordId" TEXT,
    "departmentId" TEXT,
    CONSTRAINT "AuditRecord_detailedFundNeedId_fkey" FOREIGN KEY ("detailedFundNeedId") REFERENCES "DetailedFundNeed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_financeRecordId_fkey" FOREIGN KEY ("financeRecordId") REFERENCES "ActualFinRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 将现有数据复制到新表，为detailedFundNeedId和departmentId字段找到合适的值
INSERT INTO "new_AuditRecord" 
SELECT 
    ar.id, 
    (SELECT dfn.id FROM DetailedFundNeed dfn WHERE dfn.subProjectId = ar.subProjectId AND dfn.fundTypeId = ar.fundTypeId LIMIT 1) as detailedFundNeedId,
    ar.subProjectId, 
    ar.fundTypeId, 
    ar.year, 
    ar.month, 
    ar.amount, 
    ar.status, 
    ar.remark, 
    ar.submittedBy, 
    ar.submittedAt, 
    ar.createdAt, 
    ar.updatedAt, 
    ar.financeRecordId,
    (SELECT departmentId FROM DetailedFundNeed WHERE subProjectId = ar.subProjectId AND fundTypeId = ar.fundTypeId LIMIT 1) as departmentId
FROM "AuditRecord" ar;

DROP TABLE "AuditRecord";
ALTER TABLE "new_AuditRecord" RENAME TO "AuditRecord";
CREATE UNIQUE INDEX "AuditRecord_financeRecordId_key" ON "AuditRecord"("financeRecordId");
CREATE INDEX "AuditRecord_detailedFundNeedId_idx" ON "AuditRecord"("detailedFundNeedId");
CREATE INDEX "AuditRecord_subProjectId_idx" ON "AuditRecord"("subProjectId");
CREATE INDEX "AuditRecord_fundTypeId_idx" ON "AuditRecord"("fundTypeId");
CREATE INDEX "AuditRecord_year_idx" ON "AuditRecord"("year");
CREATE INDEX "AuditRecord_month_idx" ON "AuditRecord"("month");
CREATE INDEX "AuditRecord_status_idx" ON "AuditRecord"("status");
CREATE INDEX "AuditRecord_submittedBy_idx" ON "AuditRecord"("submittedBy");
CREATE INDEX "AuditRecord_submittedAt_idx" ON "AuditRecord"("submittedAt");
CREATE INDEX "AuditRecord_financeRecordId_idx" ON "AuditRecord"("financeRecordId");
CREATE UNIQUE INDEX "AuditRecord_detailedFundNeedId_year_month_key" ON "AuditRecord"("detailedFundNeedId", "year", "month");
CREATE UNIQUE INDEX "AuditRecord_subProjectId_fundTypeId_year_month_key" ON "AuditRecord"("subProjectId", "fundTypeId", "year", "month");

CREATE TABLE "new_PredictRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL, -- 通过子查询设置默认值
    "subProjectId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL, -- 通过子查询设置默认值
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "remark" TEXT,
    "submittedBy" TEXT,
    "submittedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PredictRecord_detailedFundNeedId_fkey" FOREIGN KEY ("detailedFundNeedId") REFERENCES "DetailedFundNeed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PredictRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PredictRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PredictRecord_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "Department" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PredictRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- 将现有数据复制到新表，为detailedFundNeedId和departmentId字段找到合适的值
INSERT INTO "new_PredictRecord" 
SELECT 
    pr.id, 
    (SELECT dfn.id FROM DetailedFundNeed dfn WHERE dfn.subProjectId = pr.subProjectId AND dfn.fundTypeId = pr.fundTypeId LIMIT 1) as detailedFundNeedId,
    pr.subProjectId, 
    pr.fundTypeId, 
    (SELECT departmentId FROM DetailedFundNeed WHERE subProjectId = pr.subProjectId AND fundTypeId = pr.fundTypeId LIMIT 1) as departmentId,
    pr.year, 
    pr.month, 
    pr.amount, 
    pr.status, 
    pr.remark, 
    pr.submittedBy, 
    pr.submittedAt, 
    pr.createdAt, 
    pr.updatedAt
FROM "PredictRecord" pr;

DROP TABLE "PredictRecord";
ALTER TABLE "new_PredictRecord" RENAME TO "PredictRecord";
CREATE INDEX "PredictRecord_detailedFundNeedId_idx" ON "PredictRecord"("detailedFundNeedId");
CREATE INDEX "PredictRecord_subProjectId_idx" ON "PredictRecord"("subProjectId");
CREATE INDEX "PredictRecord_fundTypeId_idx" ON "PredictRecord"("fundTypeId");
CREATE INDEX "PredictRecord_departmentId_idx" ON "PredictRecord"("departmentId");
CREATE INDEX "PredictRecord_year_idx" ON "PredictRecord"("year");
CREATE INDEX "PredictRecord_month_idx" ON "PredictRecord"("month");
CREATE INDEX "PredictRecord_status_idx" ON "PredictRecord"("status");
CREATE INDEX "PredictRecord_submittedBy_idx" ON "PredictRecord"("submittedBy");
CREATE INDEX "PredictRecord_submittedAt_idx" ON "PredictRecord"("submittedAt");
CREATE UNIQUE INDEX "PredictRecord_detailedFundNeedId_year_month_key" ON "PredictRecord"("detailedFundNeedId", "year", "month");
CREATE UNIQUE INDEX "PredictRecord_subProjectId_fundTypeId_departmentId_year_month_key" ON "PredictRecord"("subProjectId", "fundTypeId", "departmentId", "year", "month");

CREATE TABLE "new_UserOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REPORTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_UserOrganization" ("createdAt", "id", "organizationId", "userId") SELECT "createdAt", "id", "organizationId", "userId" FROM "UserOrganization";
DROP TABLE "UserOrganization";
ALTER TABLE "new_UserOrganization" RENAME TO "UserOrganization";
CREATE INDEX "UserOrganization_userId_idx" ON "UserOrganization"("userId");
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");
CREATE INDEX "UserOrganization_role_idx" ON "UserOrganization"("role");
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "DetailedFundNeed_subProjectId_idx" ON "DetailedFundNeed"("subProjectId");

-- CreateIndex
CREATE INDEX "DetailedFundNeed_departmentId_idx" ON "DetailedFundNeed"("departmentId");

-- CreateIndex
CREATE INDEX "DetailedFundNeed_fundTypeId_idx" ON "DetailedFundNeed"("fundTypeId");

-- CreateIndex
CREATE INDEX "DetailedFundNeed_organizationId_idx" ON "DetailedFundNeed"("organizationId");

-- CreateIndex
CREATE INDEX "DetailedFundNeed_isActive_idx" ON "DetailedFundNeed"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DetailedFundNeed_subProjectId_departmentId_fundTypeId_key" ON "DetailedFundNeed"("subProjectId", "departmentId", "fundTypeId");

-- CreateIndex
CREATE INDEX "UserDepartment_userId_idx" ON "UserDepartment"("userId");

-- CreateIndex
CREATE INDEX "UserDepartment_departmentId_idx" ON "UserDepartment"("departmentId");

-- CreateIndex
CREATE INDEX "UserDepartment_role_idx" ON "UserDepartment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserDepartment_userId_departmentId_key" ON "UserDepartment"("userId", "departmentId");
