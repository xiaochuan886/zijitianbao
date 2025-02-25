-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Organization_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Organization" ("code", "createdAt", "id", "name", "updatedAt") SELECT "code", "createdAt", "id", "name", "updatedAt" FROM "Organization";
DROP TABLE "Organization";
ALTER TABLE "new_Organization" RENAME TO "Organization";
CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");
CREATE INDEX "Organization_parentId_idx" ON "Organization"("parentId");
CREATE INDEX "Organization_name_idx" ON "Organization"("name");
CREATE INDEX "Organization_code_idx" ON "Organization"("code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
