-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "organizationId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'REPORTER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProjectCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProjectCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startYear" INTEGER NOT NULL,
    "hasRecords" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "code" TEXT,
    CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Project_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProjectCategory" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubProject" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SubProject_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FundType" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "PredictRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "PredictRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PredictRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PredictRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActualUserRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "ActualUserRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualUserRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualUserRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActualFinRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "ActualFinRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "ActualFinRecord_userRecordId_fkey" FOREIGN KEY ("userRecordId") REFERENCES "ActualUserRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "AuditRecord_subProjectId_fkey" FOREIGN KEY ("subProjectId") REFERENCES "SubProject" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_fundTypeId_fkey" FOREIGN KEY ("fundTypeId") REFERENCES "FundType" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_submittedBy_fkey" FOREIGN KEY ("submittedBy") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "AuditRecord_financeRecordId_fkey" FOREIGN KEY ("financeRecordId") REFERENCES "ActualFinRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecordAudit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "predictRecordId" TEXT,
    "actualUserRecordId" TEXT,
    "actualFinRecordId" TEXT,
    "auditRecordId" TEXT,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "oldValue" TEXT,
    "newValue" TEXT,
    "role" TEXT NOT NULL,
    "remarks" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecordAudit_predictRecordId_fkey" FOREIGN KEY ("predictRecordId") REFERENCES "PredictRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecordAudit_actualUserRecordId_fkey" FOREIGN KEY ("actualUserRecordId") REFERENCES "ActualUserRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecordAudit_actualFinRecordId_fkey" FOREIGN KEY ("actualFinRecordId") REFERENCES "ActualFinRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "RecordAudit_auditRecordId_fkey" FOREIGN KEY ("auditRecordId") REFERENCES "AuditRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "permissions" TEXT,
    "result" BOOLEAN NOT NULL,
    "error" TEXT,
    "duration" INTEGER,
    "timestamp" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "UserOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WithdrawalRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "predictRecordId" TEXT,
    "actualUserRecordId" TEXT,
    "actualFinRecordId" TEXT,
    "auditRecordId" TEXT,
    "requesterId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "adminId" TEXT,
    "adminComment" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WithdrawalRequest_predictRecordId_fkey" FOREIGN KEY ("predictRecordId") REFERENCES "PredictRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_actualUserRecordId_fkey" FOREIGN KEY ("actualUserRecordId") REFERENCES "ActualUserRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_actualFinRecordId_fkey" FOREIGN KEY ("actualFinRecordId") REFERENCES "ActualFinRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_auditRecordId_fkey" FOREIGN KEY ("auditRecordId") REFERENCES "AuditRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_ProjectOrganizations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProjectOrganizations_A_fkey" FOREIGN KEY ("A") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectOrganizations_B_fkey" FOREIGN KEY ("B") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_DepartmentToProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_DepartmentToProject_A_fkey" FOREIGN KEY ("A") REFERENCES "Department" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_DepartmentToProject_B_fkey" FOREIGN KEY ("B") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_FundTypeToSubProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_FundTypeToSubProject_A_fkey" FOREIGN KEY ("A") REFERENCES "FundType" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_FundTypeToSubProject_B_fkey" FOREIGN KEY ("B") REFERENCES "SubProject" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_code_idx" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE INDEX "Department_name_idx" ON "Department"("name");

-- CreateIndex
CREATE INDEX "ProjectCategory_organizationId_idx" ON "ProjectCategory"("organizationId");

-- CreateIndex
CREATE INDEX "ProjectCategory_name_idx" ON "ProjectCategory"("name");

-- CreateIndex
CREATE INDEX "ProjectCategory_code_idx" ON "ProjectCategory"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectCategory_name_organizationId_key" ON "ProjectCategory"("name", "organizationId");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_code_idx" ON "Project"("code");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_startYear_idx" ON "Project"("startYear");

-- CreateIndex
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");

-- CreateIndex
CREATE INDEX "Project_categoryId_idx" ON "Project"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_name_organizationId_key" ON "Project"("name", "organizationId");

-- CreateIndex
CREATE INDEX "SubProject_projectId_idx" ON "SubProject"("projectId");

-- CreateIndex
CREATE INDEX "SubProject_name_idx" ON "SubProject"("name");

-- CreateIndex
CREATE INDEX "FundType_name_idx" ON "FundType"("name");

-- CreateIndex
CREATE INDEX "PredictRecord_subProjectId_idx" ON "PredictRecord"("subProjectId");

-- CreateIndex
CREATE INDEX "PredictRecord_fundTypeId_idx" ON "PredictRecord"("fundTypeId");

-- CreateIndex
CREATE INDEX "PredictRecord_year_idx" ON "PredictRecord"("year");

-- CreateIndex
CREATE INDEX "PredictRecord_month_idx" ON "PredictRecord"("month");

-- CreateIndex
CREATE INDEX "PredictRecord_status_idx" ON "PredictRecord"("status");

-- CreateIndex
CREATE INDEX "PredictRecord_submittedBy_idx" ON "PredictRecord"("submittedBy");

-- CreateIndex
CREATE INDEX "PredictRecord_submittedAt_idx" ON "PredictRecord"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PredictRecord_subProjectId_fundTypeId_year_month_key" ON "PredictRecord"("subProjectId", "fundTypeId", "year", "month");

-- CreateIndex
CREATE INDEX "ActualUserRecord_subProjectId_idx" ON "ActualUserRecord"("subProjectId");

-- CreateIndex
CREATE INDEX "ActualUserRecord_fundTypeId_idx" ON "ActualUserRecord"("fundTypeId");

-- CreateIndex
CREATE INDEX "ActualUserRecord_year_idx" ON "ActualUserRecord"("year");

-- CreateIndex
CREATE INDEX "ActualUserRecord_month_idx" ON "ActualUserRecord"("month");

-- CreateIndex
CREATE INDEX "ActualUserRecord_status_idx" ON "ActualUserRecord"("status");

-- CreateIndex
CREATE INDEX "ActualUserRecord_submittedBy_idx" ON "ActualUserRecord"("submittedBy");

-- CreateIndex
CREATE INDEX "ActualUserRecord_submittedAt_idx" ON "ActualUserRecord"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ActualUserRecord_subProjectId_fundTypeId_year_month_key" ON "ActualUserRecord"("subProjectId", "fundTypeId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ActualFinRecord_userRecordId_key" ON "ActualFinRecord"("userRecordId");

-- CreateIndex
CREATE INDEX "ActualFinRecord_subProjectId_idx" ON "ActualFinRecord"("subProjectId");

-- CreateIndex
CREATE INDEX "ActualFinRecord_fundTypeId_idx" ON "ActualFinRecord"("fundTypeId");

-- CreateIndex
CREATE INDEX "ActualFinRecord_year_idx" ON "ActualFinRecord"("year");

-- CreateIndex
CREATE INDEX "ActualFinRecord_month_idx" ON "ActualFinRecord"("month");

-- CreateIndex
CREATE INDEX "ActualFinRecord_status_idx" ON "ActualFinRecord"("status");

-- CreateIndex
CREATE INDEX "ActualFinRecord_submittedBy_idx" ON "ActualFinRecord"("submittedBy");

-- CreateIndex
CREATE INDEX "ActualFinRecord_submittedAt_idx" ON "ActualFinRecord"("submittedAt");

-- CreateIndex
CREATE INDEX "ActualFinRecord_userRecordId_idx" ON "ActualFinRecord"("userRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "ActualFinRecord_subProjectId_fundTypeId_year_month_key" ON "ActualFinRecord"("subProjectId", "fundTypeId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AuditRecord_financeRecordId_key" ON "AuditRecord"("financeRecordId");

-- CreateIndex
CREATE INDEX "AuditRecord_subProjectId_idx" ON "AuditRecord"("subProjectId");

-- CreateIndex
CREATE INDEX "AuditRecord_fundTypeId_idx" ON "AuditRecord"("fundTypeId");

-- CreateIndex
CREATE INDEX "AuditRecord_year_idx" ON "AuditRecord"("year");

-- CreateIndex
CREATE INDEX "AuditRecord_month_idx" ON "AuditRecord"("month");

-- CreateIndex
CREATE INDEX "AuditRecord_status_idx" ON "AuditRecord"("status");

-- CreateIndex
CREATE INDEX "AuditRecord_submittedBy_idx" ON "AuditRecord"("submittedBy");

-- CreateIndex
CREATE INDEX "AuditRecord_submittedAt_idx" ON "AuditRecord"("submittedAt");

-- CreateIndex
CREATE INDEX "AuditRecord_financeRecordId_idx" ON "AuditRecord"("financeRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "AuditRecord_subProjectId_fundTypeId_year_month_key" ON "AuditRecord"("subProjectId", "fundTypeId", "year", "month");

-- CreateIndex
CREATE INDEX "RecordAudit_predictRecordId_idx" ON "RecordAudit"("predictRecordId");

-- CreateIndex
CREATE INDEX "RecordAudit_actualUserRecordId_idx" ON "RecordAudit"("actualUserRecordId");

-- CreateIndex
CREATE INDEX "RecordAudit_actualFinRecordId_idx" ON "RecordAudit"("actualFinRecordId");

-- CreateIndex
CREATE INDEX "RecordAudit_auditRecordId_idx" ON "RecordAudit"("auditRecordId");

-- CreateIndex
CREATE INDEX "RecordAudit_userId_idx" ON "RecordAudit"("userId");

-- CreateIndex
CREATE INDEX "RecordAudit_action_idx" ON "RecordAudit"("action");

-- CreateIndex
CREATE INDEX "RecordAudit_timestamp_idx" ON "RecordAudit"("timestamp");

-- CreateIndex
CREATE INDEX "RecordAudit_role_idx" ON "RecordAudit"("role");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_resource_idx" ON "AuditLog"("resource");

-- CreateIndex
CREATE INDEX "AuditLog_timestamp_idx" ON "AuditLog"("timestamp");

-- CreateIndex
CREATE INDEX "UserOrganization_userId_idx" ON "UserOrganization"("userId");

-- CreateIndex
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_predictRecordId_key" ON "WithdrawalRequest"("predictRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_actualUserRecordId_key" ON "WithdrawalRequest"("actualUserRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_actualFinRecordId_key" ON "WithdrawalRequest"("actualFinRecordId");

-- CreateIndex
CREATE UNIQUE INDEX "WithdrawalRequest_auditRecordId_key" ON "WithdrawalRequest"("auditRecordId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_predictRecordId_idx" ON "WithdrawalRequest"("predictRecordId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_actualUserRecordId_idx" ON "WithdrawalRequest"("actualUserRecordId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_actualFinRecordId_idx" ON "WithdrawalRequest"("actualFinRecordId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_auditRecordId_idx" ON "WithdrawalRequest"("auditRecordId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_requesterId_idx" ON "WithdrawalRequest"("requesterId");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");

-- CreateIndex
CREATE INDEX "WithdrawalRequest_createdAt_idx" ON "WithdrawalRequest"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectOrganizations_AB_unique" ON "_ProjectOrganizations"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectOrganizations_B_index" ON "_ProjectOrganizations"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_DepartmentToProject_AB_unique" ON "_DepartmentToProject"("A", "B");

-- CreateIndex
CREATE INDEX "_DepartmentToProject_B_index" ON "_DepartmentToProject"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_FundTypeToSubProject_AB_unique" ON "_FundTypeToSubProject"("A", "B");

-- CreateIndex
CREATE INDEX "_FundTypeToSubProject_B_index" ON "_FundTypeToSubProject"("B");
