-- AlterTable
ALTER TABLE "Project" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE INDEX "Project_code_idx" ON "Project"("code");
