-- CreateTable
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

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Record" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subProjectId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "predicted" REAL,
    "actualUser" REAL,
    "actualFinance" REAL,
    "auditResult" REAL,
    "status" TEXT NOT NULL,
    "predictUserStatus" TEXT NOT NULL DEFAULT 'draft',
    "actualUserStatus" TEXT NOT NULL DEFAULT 'draft',
    "actualFinanceStatus" TEXT NOT NULL DEFAULT 'draft',
    "auditFinanceStatus" TEXT NOT NULL DEFAULT 'draft',
    "submittedBy" TEXT NOT NULL,
    "submittedAt" DATETIME,
    "remark" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Record_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Record" ("actualFinance", "actualUser", "auditResult", "createdAt", "id", "month", "predicted", "remark", "status", "subProjectId", "submittedAt", "submittedBy", "updatedAt", "year") SELECT "actualFinance", "actualUser", "auditResult", "createdAt", "id", "month", "predicted", "remark", "status", "subProjectId", "submittedAt", "submittedBy", "updatedAt", "year" FROM "Record";
DROP TABLE "Record";
ALTER TABLE "new_Record" RENAME TO "Record";
CREATE INDEX "Record_subProjectId_idx" ON "Record"("subProjectId");
CREATE INDEX "Record_year_idx" ON "Record"("year");
CREATE INDEX "Record_month_idx" ON "Record"("month");
CREATE INDEX "Record_status_idx" ON "Record"("status");
CREATE INDEX "Record_predictUserStatus_idx" ON "Record"("predictUserStatus");
CREATE INDEX "Record_actualUserStatus_idx" ON "Record"("actualUserStatus");
CREATE INDEX "Record_actualFinanceStatus_idx" ON "Record"("actualFinanceStatus");
CREATE INDEX "Record_auditFinanceStatus_idx" ON "Record"("auditFinanceStatus");
CREATE INDEX "Record_submittedBy_idx" ON "Record"("submittedBy");
CREATE INDEX "Record_submittedAt_idx" ON "Record"("submittedAt");
CREATE UNIQUE INDEX "Record_subProjectId_year_month_key" ON "Record"("subProjectId", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RecordAudit_recordId_idx" ON "RecordAudit"("recordId");

-- CreateIndex
CREATE INDEX "RecordAudit_userId_idx" ON "RecordAudit"("userId");

-- CreateIndex
CREATE INDEX "RecordAudit_action_idx" ON "RecordAudit"("action");

-- CreateIndex
CREATE INDEX "RecordAudit_timestamp_idx" ON "RecordAudit"("timestamp");

-- CreateIndex
CREATE INDEX "RecordAudit_role_idx" ON "RecordAudit"("role");
