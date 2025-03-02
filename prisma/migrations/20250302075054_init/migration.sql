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
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
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
    "categoryId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "code" TEXT,
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
CREATE TABLE "PredictRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
    "subProjectId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "UserOrganization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'REPORTER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserOrganization_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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

-- CreateTable
CREATE TABLE "ActualUserRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
    "subProjectId" TEXT NOT NULL,
    "fundTypeId" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "ActualFinRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "AuditRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "detailedFundNeedId" TEXT NOT NULL,
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
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "SubProject_projectId_idx" ON "SubProject"("projectId");

-- CreateIndex
CREATE INDEX "SubProject_name_idx" ON "SubProject"("name");

-- CreateIndex
CREATE INDEX "FundType_name_idx" ON "FundType"("name");

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
CREATE INDEX "PredictRecord_detailedFundNeedId_idx" ON "PredictRecord"("detailedFundNeedId");

-- CreateIndex
CREATE INDEX "PredictRecord_subProjectId_idx" ON "PredictRecord"("subProjectId");

-- CreateIndex
CREATE INDEX "PredictRecord_fundTypeId_idx" ON "PredictRecord"("fundTypeId");

-- CreateIndex
CREATE INDEX "PredictRecord_departmentId_idx" ON "PredictRecord"("departmentId");

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
CREATE UNIQUE INDEX "PredictRecord_detailedFundNeedId_year_month_key" ON "PredictRecord"("detailedFundNeedId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "PredictRecord_subProjectId_fundTypeId_departmentId_year_month_key" ON "PredictRecord"("subProjectId", "fundTypeId", "departmentId", "year", "month");

-- CreateIndex
CREATE INDEX "UserOrganization_userId_idx" ON "UserOrganization"("userId");

-- CreateIndex
CREATE INDEX "UserOrganization_organizationId_idx" ON "UserOrganization"("organizationId");

-- CreateIndex
CREATE INDEX "UserOrganization_role_idx" ON "UserOrganization"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserOrganization_userId_organizationId_key" ON "UserOrganization"("userId", "organizationId");

-- CreateIndex
CREATE INDEX "UserDepartment_userId_idx" ON "UserDepartment"("userId");

-- CreateIndex
CREATE INDEX "UserDepartment_departmentId_idx" ON "UserDepartment"("departmentId");

-- CreateIndex
CREATE INDEX "UserDepartment_role_idx" ON "UserDepartment"("role");

-- CreateIndex
CREATE UNIQUE INDEX "UserDepartment_userId_departmentId_key" ON "UserDepartment"("userId", "departmentId");

-- CreateIndex
CREATE INDEX "ActualUserRecord_detailedFundNeedId_idx" ON "ActualUserRecord"("detailedFundNeedId");

-- CreateIndex
CREATE INDEX "ActualUserRecord_departmentId_idx" ON "ActualUserRecord"("departmentId");

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
CREATE UNIQUE INDEX "ActualUserRecord_detailedFundNeedId_year_month_key" ON "ActualUserRecord"("detailedFundNeedId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ActualUserRecord_subProjectId_fundTypeId_departmentId_year_month_key" ON "ActualUserRecord"("subProjectId", "fundTypeId", "departmentId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ActualFinRecord_userRecordId_key" ON "ActualFinRecord"("userRecordId");

-- CreateIndex
CREATE INDEX "ActualFinRecord_detailedFundNeedId_idx" ON "ActualFinRecord"("detailedFundNeedId");

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
CREATE UNIQUE INDEX "ActualFinRecord_detailedFundNeedId_year_month_key" ON "ActualFinRecord"("detailedFundNeedId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ActualFinRecord_subProjectId_fundTypeId_year_month_key" ON "ActualFinRecord"("subProjectId", "fundTypeId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "AuditRecord_financeRecordId_key" ON "AuditRecord"("financeRecordId");

-- CreateIndex
CREATE INDEX "AuditRecord_detailedFundNeedId_idx" ON "AuditRecord"("detailedFundNeedId");

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
CREATE UNIQUE INDEX "AuditRecord_detailedFundNeedId_year_month_key" ON "AuditRecord"("detailedFundNeedId", "year", "month");

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
