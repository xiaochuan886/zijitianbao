/*
  Warnings:

  - You are about to drop the `_OrganizationToProject` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `organizationId` to the `Project` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "_OrganizationToProject_B_index";

-- DropIndex
DROP INDEX "_OrganizationToProject_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_OrganizationToProject";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "_ProjectOrganizations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ProjectOrganizations_A_fkey" FOREIGN KEY ("A") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ProjectOrganizations_B_fkey" FOREIGN KEY ("B") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "startYear" INTEGER NOT NULL,
    "hasRecords" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Project" ("createdAt", "id", "name", "startYear", "status", "updatedAt") SELECT "createdAt", "id", "name", "startYear", "status", "updatedAt" FROM "Project";
DROP TABLE "Project";
ALTER TABLE "new_Project" RENAME TO "Project";
CREATE INDEX "Project_name_idx" ON "Project"("name");
CREATE INDEX "Project_status_idx" ON "Project"("status");
CREATE INDEX "Project_startYear_idx" ON "Project"("startYear");
CREATE INDEX "Project_organizationId_idx" ON "Project"("organizationId");
CREATE UNIQUE INDEX "Project_name_organizationId_key" ON "Project"("name", "organizationId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "_ProjectOrganizations_AB_unique" ON "_ProjectOrganizations"("A", "B");

-- CreateIndex
CREATE INDEX "_ProjectOrganizations_B_index" ON "_ProjectOrganizations"("B");
