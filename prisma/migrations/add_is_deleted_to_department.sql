-- 为Department表添加isDeleted字段
ALTER TABLE "Department" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false; 