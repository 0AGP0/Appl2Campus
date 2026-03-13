-- Student tablosunda şemada olup production'da eksik kalan tüm kolonlar (tek seferde)
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaApplicationDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaAppointmentDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaStartDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaEndDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaDocumentPath" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "accommodationPackage" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "accommodationStartDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseCity" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseName" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseStartDate" TIMESTAMP(3);
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseInstitutionId" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseRegistrationDocPath" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseInvoicePath" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCourseReceiptPath" TEXT;
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "languageCoursePostponements" JSONB;

-- İndeksler (yoksa oluştur)
CREATE INDEX IF NOT EXISTS "Student_accommodationPackage_idx" ON "Student"("accommodationPackage");
CREATE INDEX IF NOT EXISTS "Student_languageCourseCity_idx" ON "Student"("languageCourseCity");

-- languageCourseInstitutionId FK (Institution tablosuna; tablo zaten var)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Student_languageCourseInstitutionId_fkey'
  ) THEN
    ALTER TABLE "Student" ADD CONSTRAINT "Student_languageCourseInstitutionId_fkey"
      FOREIGN KEY ("languageCourseInstitutionId") REFERENCES "Institution"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
