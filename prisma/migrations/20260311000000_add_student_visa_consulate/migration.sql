-- AlterTable: Student.visaConsulate (Başvurulan konsolosluk) - production'da eksik kalan kolon
ALTER TABLE "Student" ADD COLUMN IF NOT EXISTS "visaConsulate" TEXT;
