/*
  Warnings:

  - You are about to drop the `_DepartmentToProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_FundTypeToSubProject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_ProjectOrganizations` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "_DepartmentToProject_B_index";

-- DropIndex
DROP INDEX "_DepartmentToProject_AB_unique";

-- DropIndex
DROP INDEX "_FundTypeToSubProject_B_index";

-- DropIndex
DROP INDEX "_FundTypeToSubProject_AB_unique";

-- DropIndex
DROP INDEX "_ProjectOrganizations_B_index";

-- DropIndex
DROP INDEX "_ProjectOrganizations_AB_unique";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_DepartmentToProject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_FundTypeToSubProject";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "_ProjectOrganizations";
PRAGMA foreign_keys=on;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Department" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Department_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Department" ("createdAt", "id", "name", "organizationId", "updatedAt") SELECT "createdAt", "id", "name", "organizationId", "updatedAt" FROM "Department";
DROP TABLE "Department";
ALTER TABLE "new_Department" RENAME TO "Department";
CREATE INDEX "Department_organizationId_idx" ON "Department"("organizationId");
CREATE INDEX "Department_name_idx" ON "Department"("name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
