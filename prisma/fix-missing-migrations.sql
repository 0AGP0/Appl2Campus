-- Eksik migration'ları tamamla (sunucuda bir kez çalıştır, idempotent)
-- Student vize kolonları (migration 20260219213631)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Student' AND column_name = 'visaCity') THEN
    ALTER TABLE "Student" ADD COLUMN "visaCity" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Student' AND column_name = 'visaInstitution') THEN
    ALTER TABLE "Student" ADD COLUMN "visaInstitution" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Student' AND column_name = 'visaNotes') THEN
    ALTER TABLE "Student" ADD COLUMN "visaNotes" TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'Student' AND column_name = 'visaProgramStartDate') THEN
    ALTER TABLE "Student" ADD COLUMN "visaProgramStartDate" TIMESTAMP(3);
  END IF;
END $$;
