/**
 * Sadece demo admin + danışman kullanıcılarını ekler/günceller.
 * Öğrencilere dokunmaz. Sunucuda danışman listesi boşsa bu script'i çalıştırın.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ADMIN_EMAIL = "admin@educonsult.local";
const CONSULTANT_EMAIL = "sarah@educonsult.local";
const PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      email: ADMIN_EMAIL,
      name: "Admin Team",
      passwordHash,
      role: "ADMIN",
    },
  });

  const consultant = await prisma.user.upsert({
    where: { email: CONSULTANT_EMAIL },
    update: {},
    create: {
      email: CONSULTANT_EMAIL,
      name: "Sarah Jenkins",
      passwordHash,
      role: "CONSULTANT",
    },
  });

  // Seed öğrencileri varsa danışmana bağla (assignedConsultantId boşsa)
  const updated = await prisma.student.updateMany({
    where: {
      id: { in: ["seed-student-1", "seed-student-2"] },
      OR: [{ assignedConsultantId: null }, { assignedConsultantId: { not: consultant.id } }],
    },
    data: { assignedConsultantId: consultant.id },
  });

  console.log("Demo kullanıcılar güncellendi:");
  console.log("  Admin:", admin.email, "(şifre:", PASSWORD + ")");
  console.log("  Danışman:", consultant.email, "(şifre:", PASSWORD + ")");
  if (updated.count > 0) console.log("  Öğrenci ataması:", updated.count, "öğrenci danışmana bağlandı.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
