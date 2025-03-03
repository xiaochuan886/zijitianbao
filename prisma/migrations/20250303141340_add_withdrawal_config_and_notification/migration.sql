-- CreateTable
CREATE TABLE "WithdrawalConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "moduleType" TEXT NOT NULL,
    "allowedStatuses" TEXT NOT NULL,
    "timeLimit" INTEGER NOT NULL,
    "maxAttempts" INTEGER NOT NULL,
    "requireApproval" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "type" TEXT NOT NULL,
    "relatedId" TEXT,
    "relatedType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "readAt" DATETIME,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WithdrawalRequest" (
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
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WithdrawalRequest_predictRecordId_fkey" FOREIGN KEY ("predictRecordId") REFERENCES "PredictRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_actualUserRecordId_fkey" FOREIGN KEY ("actualUserRecordId") REFERENCES "ActualUserRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_actualFinRecordId_fkey" FOREIGN KEY ("actualFinRecordId") REFERENCES "ActualFinRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_auditRecordId_fkey" FOREIGN KEY ("auditRecordId") REFERENCES "AuditRecord" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "WithdrawalRequest_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_WithdrawalRequest" ("actualFinRecordId", "actualUserRecordId", "adminComment", "adminId", "auditRecordId", "createdAt", "id", "predictRecordId", "reason", "requesterId", "status", "updatedAt") SELECT "actualFinRecordId", "actualUserRecordId", "adminComment", "adminId", "auditRecordId", "createdAt", "id", "predictRecordId", "reason", "requesterId", "status", "updatedAt" FROM "WithdrawalRequest";
DROP TABLE "WithdrawalRequest";
ALTER TABLE "new_WithdrawalRequest" RENAME TO "WithdrawalRequest";
CREATE INDEX "WithdrawalRequest_predictRecordId_idx" ON "WithdrawalRequest"("predictRecordId");
CREATE INDEX "WithdrawalRequest_actualUserRecordId_idx" ON "WithdrawalRequest"("actualUserRecordId");
CREATE INDEX "WithdrawalRequest_actualFinRecordId_idx" ON "WithdrawalRequest"("actualFinRecordId");
CREATE INDEX "WithdrawalRequest_auditRecordId_idx" ON "WithdrawalRequest"("auditRecordId");
CREATE INDEX "WithdrawalRequest_requesterId_idx" ON "WithdrawalRequest"("requesterId");
CREATE INDEX "WithdrawalRequest_adminId_idx" ON "WithdrawalRequest"("adminId");
CREATE INDEX "WithdrawalRequest_status_idx" ON "WithdrawalRequest"("status");
CREATE INDEX "WithdrawalRequest_createdAt_idx" ON "WithdrawalRequest"("createdAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WithdrawalConfig_moduleType_idx" ON "WithdrawalConfig"("moduleType");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_isRead_idx" ON "Notification"("isRead");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
