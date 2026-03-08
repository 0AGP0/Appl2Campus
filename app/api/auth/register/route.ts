import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { validatePassword } from "@/lib/password";
import { checkRegisterRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  if (!(await checkRegisterRateLimit(ip))) {
    return NextResponse.json(
      { error: "Çok fazla kayıt denemesi. Lütfen 15 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }
  const body = await req.json();
  const { name, email, password } = body;
  if (!name || !email || !password || typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
  }
  const trimmedEmail = email.trim().toLowerCase();
  const pwdCheck = validatePassword(password);
  if (!pwdCheck.ok) {
    return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const student = await prisma.student.create({
      data: {
        name: name.trim().slice(0, 200),
        studentEmail: trimmedEmail,
        stage: "lead",
      },
    });
    await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: name.trim().slice(0, 200),
        passwordHash,
        role: "STUDENT",
        studentId: student.id,
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("Register error:", e);
    return NextResponse.json(
      { error: "Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
