-- DocumentCategory ve StudentDocumentByCategory tablolarını manuel oluştur
-- Migration kayıtlı ama tablolar eksik olduğunda kullanılır.

-- DocumentStatus enum (StudentDocumentByCategory için gerekli)
DO $$ BEGIN
  CREATE TYPE "DocumentStatus" AS ENUM ('UPLOADED', 'APPROVED', 'REVISION_REQUESTED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- DocumentCategoryType enum (zaten varsa hata vermez)
DO $$ BEGIN
  CREATE TYPE "DocumentCategoryType" AS ENUM ('OPERATION_UPLOADED', 'STUDENT_UPLOADED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Student tablosuna vize alanları (migration'da varsa)
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaCity" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaInstitution" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaNotes" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaProgramStartDate" TIMESTAMP(3);

-- DocumentCategory tablosu
CREATE TABLE IF NOT EXISTS "DocumentCategory" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" "DocumentCategoryType" NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DocumentCategory_pkey" PRIMARY KEY ("id")
);

-- Unique index
CREATE UNIQUE INDEX IF NOT EXISTS "DocumentCategory_slug_key" ON "DocumentCategory"("slug");
CREATE INDEX IF NOT EXISTS "DocumentCategory_type_idx" ON "DocumentCategory"("type");

-- StudentDocumentByCategory tablosu
CREATE TABLE IF NOT EXISTS "StudentDocumentByCategory" (
  "id" TEXT NOT NULL,
  "studentId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "version" INTEGER NOT NULL DEFAULT 1,
  "status" "DocumentStatus" NOT NULL DEFAULT 'UPLOADED',
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "uploadedBy" TEXT,
  CONSTRAINT "StudentDocumentByCategory_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX IF NOT EXISTS "StudentDocumentByCategory_studentId_idx" ON "StudentDocumentByCategory"("studentId");
CREATE INDEX IF NOT EXISTS "StudentDocumentByCategory_studentId_categoryId_idx" ON "StudentDocumentByCategory"("studentId", "categoryId");

-- Foreign keys (mevcut değilse ekle)
DO $$ BEGIN
  ALTER TABLE "StudentDocumentByCategory" ADD CONSTRAINT "StudentDocumentByCategory_studentId_fkey"
    FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "StudentDocumentByCategory" ADD CONSTRAINT "StudentDocumentByCategory_categoryId_fkey"
    FOREIGN KEY ("categoryId") REFERENCES "DocumentCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
