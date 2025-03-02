/*
  Warnings:

  - You are about to drop the column `organizationId` on the `ProjectCategory` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProjectCategory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ProjectCategory" ("code", "createdAt", "id", "name", "updatedAt") SELECT "code", "createdAt", "id", "name", "updatedAt" FROM "ProjectCategory";
DROP TABLE "ProjectCategory";
ALTER TABLE "new_ProjectCategory" RENAME TO "ProjectCategory";
CREATE UNIQUE INDEX "ProjectCategory_name_key" ON "ProjectCategory"("name");
CREATE INDEX "ProjectCategory_name_idx" ON "ProjectCategory"("name");
CREATE INDEX "ProjectCategory_code_idx" ON "ProjectCategory"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
