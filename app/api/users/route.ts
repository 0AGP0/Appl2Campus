import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const users = await prisma.user.findMany({
      where: {
        role: { in: ["CONSULTANT", "OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        _count: { select: { assignedStudents: true } },
        assignedStudents: { select: { id: true, name: true } },
        auditLogs: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, message: true },
        },
      },
    });
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, name: true, email: true },
    });
    return NextResponse.json({ consultants: users, admins });
  } catch (e) {
    console.error("GET /api/users error:", e);
    try {
      const users = await prisma.user.findMany({
        where: {
          role: { in: ["CONSULTANT", "OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"] },
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          _count: { select: { assignedStudents: true } },
          assignedStudents: { select: { id: true, name: true } },
        },
      });
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" },
        select: { id: true, name: true, email: true },
      });
      return NextResponse.json({ consultants: users, admins });
    } catch (e2) {
      console.error("GET /api/users fallback error:", e2);
      return NextResponse.json({ error: "Liste yüklenemedi." }, { status: 500 });
    }
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, email, password, role: newRole } = body;
  const allowedRoles = ["CONSULTANT", "OPERATION_UNIVERSITY", "OPERATION_ACCOMMODATION", "OPERATION_VISA"] as const;
  const assignRole = allowedRoles.includes(newRole) ? newRole : "CONSULTANT";
  if (!email || typeof email !== "string") return NextResponse.json({ error: "Email required" }, { status: 400 });
  const trimmedEmail = email.trim().toLowerCase();
  if (password) {
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.ok) return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
  }
  if (!password) return NextResponse.json({ error: "Şifre gerekli" }, { status: 400 });

  const existing = await prisma.user.findUnique({ where: { email: trimmedEmail } });
  const rawName = (name ?? trimmedEmail).toString().trim() || null;
  const safeName = rawName ? rawName.slice(0, 200) : null;

  if (existing) {
    // E-posta zaten var: danışman/operasyon rolüne güncelle ki listede görünsün
    try {
      const passwordHash = password ? await bcrypt.hash(String(password), 10) : undefined;
      const user = await prisma.user.update({
        where: { id: existing.id },
        data: {
          role: assignRole,
          ...(safeName != null && { name: safeName }),
          ...(passwordHash && { passwordHash }),
        },
      });
      return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role, updated: true }, { status: 200 });
    } catch (e) {
      console.error("User update error:", e);
      return NextResponse.json({ error: "Kullanıcı güncellenemedi." }, { status: 500 });
    }
  }

  try {
    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await prisma.user.create({
      data: {
        email: trimmedEmail,
        name: safeName,
        passwordHash,
        role: assignRole,
      },
    });
    return NextResponse.json({ id: user.id, name: user.name, email: user.email, role: user.role }, { status: 201 });
  } catch (e) {
    console.error("User create error:", e);
    return NextResponse.json(
      { error: "Kullanıcı oluşturulamadı. Lütfen tekrar deneyin." },
      { status: 500 }
    );
  }
}
