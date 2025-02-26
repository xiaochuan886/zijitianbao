-- CreateIndex
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");

-- CreateIndex
CREATE INDEX "Department_name_idx" ON "Department"("name");

-- CreateIndex
CREATE INDEX "FundType_name_idx" ON "FundType"("name");

-- CreateIndex
CREATE INDEX "Organization_name_idx" ON "Organization"("name");

-- CreateIndex
CREATE INDEX "Organization_code_idx" ON "Organization"("code");

-- CreateIndex
CREATE INDEX "Project_name_idx" ON "Project"("name");

-- CreateIndex
CREATE INDEX "Project_status_idx" ON "Project"("status");

-- CreateIndex
CREATE INDEX "Project_startYear_idx" ON "Project"("startYear");

-- CreateIndex
CREATE INDEX "Record_subProjectId_idx" ON "Record"("subProjectId");

-- CreateIndex
CREATE INDEX "Record_year_idx" ON "Record"("year");

-- CreateIndex
CREATE INDEX "Record_month_idx" ON "Record"("month");

-- CreateIndex
CREATE INDEX "Record_status_idx" ON "Record"("status");

-- CreateIndex
CREATE INDEX "Record_submittedBy_idx" ON "Record"("submittedBy");

-- CreateIndex
CREATE INDEX "Record_submittedAt_idx" ON "Record"("submittedAt");

-- CreateIndex
CREATE INDEX "SubProject_projectId_idx" ON "SubProject"("projectId");

-- CreateIndex
CREATE INDEX "SubProject_name_idx" ON "SubProject"("name");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");
