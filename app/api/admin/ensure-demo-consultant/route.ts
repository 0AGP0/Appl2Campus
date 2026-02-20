import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const DEMO_CONSULTANT_EMAIL = "sarah@educonsult.local";
const DEMO_CONSULTANT_NAME = "Sarah Jenkins";
const DEMO_PASSWORD = "password123";

/**
 * Demo danışman yoksa oluşturur (sadece ADMIN).
 * Aynı kullanıcıyı API üzerinden eklediğimiz için listede kesin görünür.
 */
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const consultant = await prisma.user.upsert({
    where: { email: DEMO_CONSULTANT_EMAIL },
    update: { role: "CONSULTANT", name: DEMO_CONSULTANT_NAME, passwordHash },
    create: {
      email: DEMO_CONSULTANT_EMAIL,
      name: DEMO_CONSULTANT_NAME,
      passwordHash,
      role: "CONSULTANT",
    },
  });

  return NextResponse.json({
    ok: true,
    email: consultant.email,
    message: `Demo danışman eklendi: ${consultant.email} (şifre: ${DEMO_PASSWORD})`,
  });
}
