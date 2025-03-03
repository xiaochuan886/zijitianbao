/*
  Warnings:

  - You are about to drop the column `departmentId` on the `ActualFinRecord` table. All the data in the column will be lost.
  - You are about to drop the column `fundTypeId` on the `ActualFinRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subProjectId` on the `ActualFinRecord` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `ActualUserRecord` table. All the data in the column will be lost.
  - You are about to drop the column `fundTypeId` on the `ActualUserRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subProjectId` on the `ActualUserRecord` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `AuditRecord` table. All the data in the column will be lost.
  - You are about to drop the column `fundTypeId` on the `AuditRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subProjectId` on the `AuditRecord` table. All the data in the column will be lost.
  - You are about to drop the column `departmentId` on the `PredictRecord` table. All the data in the column will be lost.
  - You are about to drop the column `fundTypeId` on the `PredictRecord` table. All the data in the column will be lost.
  - You are about to drop the column `subProjectId` on the `PredictRecord` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ActualFinRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
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
    CONSTRAINT "ActualFinRecord_detailedFundNeedId_fkey" FOREIGN KEY ("detailedFundNeedId") REFERENCES "DetailedFundNeed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_userRecordId_fkey" FOREIGN KEY ("userRecordId") REFERENCES "ActualUserRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActualFinRecord" ("amount", "createdAt", "detailedFundNeedId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "userRecordId", "year") SELECT "amount", "createdAt", "detailedFundNeedId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "userRecordId", "year" FROM "ActualFinRecord";
DROP TABLE "ActualFinRecord";
ALTER TABLE "new_ActualFinRecord" RENAME TO "ActualFinRecord";
CREATE UNIQUE INDEX "ActualFinRecord_userRecordId_key" ON "ActualFinRecord"("userRecordId");
CREATE INDEX "ActualFinRecord_detailedFundNeedId_idx" ON "ActualFinRecord"("detailedFundNeedId");
CREATE INDEX "ActualFinRecord_year_idx" ON "ActualFinRecord"("year");
CREATE INDEX "ActualFinRecord_month_idx" ON "ActualFinRecord"("month");
CREATE INDEX "ActualFinRecord_status_idx" ON "ActualFinRecord"("status");
CREATE INDEX "ActualFinRecord_submittedBy_idx" ON "ActualFinRecord"("submittedBy");
CREATE INDEX "ActualFinRecord_submittedAt_idx" ON "ActualFinRecord"("submittedAt");
CREATE INDEX "ActualFinRecord_userRecordId_idx" ON "ActualFinRecord"("userRecordId");
CREATE UNIQUE INDEX "ActualFinRecord_detailedFundNeedId_year_month_key" ON "ActualFinRecord"("detailedFundNeedId", "year", "month");
CREATE TABLE "new_ActualUserRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
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
    CONSTRAINT "ActualUserRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_ActualUserRecord" ("amount", "createdAt", "detailedFundNeedId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "year") SELECT "amount", "createdAt", "detailedFundNeedId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "year" FROM "ActualUserRecord";
DROP TABLE "ActualUserRecord";
ALTER TABLE "new_ActualUserRecord" RENAME TO "ActualUserRecord";
CREATE INDEX "ActualUserRecord_detailedFundNeedId_idx" ON "ActualUserRecord"("detailedFundNeedId");
CREATE INDEX "ActualUserRecord_year_idx" ON "ActualUserRecord"("year");
CREATE INDEX "ActualUserRecord_month_idx" ON "ActualUserRecord"("month");
CREATE INDEX "ActualUserRecord_status_idx" ON "ActualUserRecord"("status");
CREATE INDEX "ActualUserRecord_submittedBy_idx" ON "ActualUserRecord"("submittedBy");
CREATE INDEX "ActualUserRecord_submittedAt_idx" ON "ActualUserRecord"("submittedAt");
CREATE UNIQUE INDEX "ActualUserRecord_detailedFundNeedId_year_month_key" ON "ActualUserRecord"("detailedFundNeedId", "year", "month");
CREATE TABLE "new_AuditRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
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
    CONSTRAINT "AuditRecord_detailedFundNeedId_fkey" FOREIGN KEY ("detailedFundNeedId") REFERENCES "DetailedFundNeed" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_financeRecordId_fkey" FOREIGN KEY ("financeRecordId") REFERENCES "ActualFinRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_AuditRecord" ("amount", "createdAt", "detailedFundNeedId", "financeRecordId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "year") SELECT "amount", "createdAt", "detailedFundNeedId", "financeRecordId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "year" FROM "AuditRecord";
DROP TABLE "AuditRecord";
ALTER TABLE "new_AuditRecord" RENAME TO "AuditRecord";
CREATE UNIQUE INDEX "AuditRecord_financeRecordId_key" ON "AuditRecord"("financeRecordId");
CREATE INDEX "AuditRecord_detailedFundNeedId_idx" ON "AuditRecord"("detailedFundNeedId");
CREATE INDEX "AuditRecord_year_idx" ON "AuditRecord"("year");
CREATE INDEX "AuditRecord_month_idx" ON "AuditRecord"("month");
CREATE INDEX "AuditRecord_status_idx" ON "AuditRecord"("status");
CREATE INDEX "AuditRecord_submittedBy_idx" ON "AuditRecord"("submittedBy");
CREATE INDEX "AuditRecord_submittedAt_idx" ON "AuditRecord"("submittedAt");
CREATE INDEX "AuditRecord_financeRecordId_idx" ON "AuditRecord"("financeRecordId");
CREATE UNIQUE INDEX "AuditRecord_detailedFundNeedId_year_month_key" ON "AuditRecord"("detailedFundNeedId", "year", "month");
CREATE TABLE "new_PredictRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
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
    CONSTRAINT "PredictRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_PredictRecord" ("amount", "createdAt", "detailedFundNeedId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "year") SELECT "amount", "createdAt", "detailedFundNeedId", "id", "month", "remark", "status", "submittedAt", "submittedBy", "updatedAt", "year" FROM "PredictRecord";
DROP TABLE "PredictRecord";
ALTER TABLE "new_PredictRecord" RENAME TO "PredictRecord";
CREATE INDEX "PredictRecord_detailedFundNeedId_idx" ON "PredictRecord"("detailedFundNeedId");
CREATE INDEX "PredictRecord_year_idx" ON "PredictRecord"("year");
CREATE INDEX "PredictRecord_month_idx" ON "PredictRecord"("month");
CREATE INDEX "PredictRecord_status_idx" ON "PredictRecord"("status");
CREATE INDEX "PredictRecord_submittedBy_idx" ON "PredictRecord"("submittedBy");
CREATE INDEX "PredictRecord_submittedAt_idx" ON "PredictRecord"("submittedAt");
CREATE UNIQUE INDEX "PredictRecord_detailedFundNeedId_year_month_key" ON "PredictRecord"("detailedFundNeedId", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
