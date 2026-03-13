import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { getStudentsForUser } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createConsultantNotification } from "@/lib/notifications";
import { validatePassword } from "@/lib/password";
import bcrypt from "bcryptjs";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const students = await getStudentsForUser(session.user.id, role, sessionStudentId);

  const search = req.nextUrl.searchParams.get("search") ?? "";
  const stage = req.nextUrl.searchParams.get("stage") ?? "";
  const stageNot = req.nextUrl.searchParams.get("stageNot") ?? ""; // Örn. "bitten"
  const gmailStatus = req.nextUrl.searchParams.get("gmailStatus") ?? "";
  const consultantId = req.nextUrl.searchParams.get("consultantId") ?? "";
  const accommodationPackage = req.nextUrl.searchParams.get("accommodationPackage") ?? ""; // "true" | "false"
  const languageCourseCity = req.nextUrl.searchParams.get("languageCourseCity") ?? ""; // içerir araması
  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10));
  const pageSize = Math.min(250, Math.max(10, parseInt(req.nextUrl.searchParams.get("pageSize") ?? "50", 10)));

  let filtered = students;
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentEmail?.toLowerCase().includes(q) ||
        s.gmailAddress?.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    );
  }
  if (stage) filtered = filtered.filter((s) => s.stage === stage);
  if (stageNot) filtered = filtered.filter((s) => s.stage !== stageNot);
  if (gmailStatus) {
    filtered = filtered.filter((s) => {
      const status = s.gmailConnection?.status ?? "disconnected";
      return status === gmailStatus;
    });
  }
  if (consultantId && role === "ADMIN")
    filtered = filtered.filter((s) => s.assignedConsultantId === consultantId);
  if (accommodationPackage === "true") filtered = filtered.filter((s) => (s as { accommodationPackage?: boolean }).accommodationPackage === true);
  if (accommodationPackage === "false") filtered = filtered.filter((s) => (s as { accommodationPackage?: boolean }).accommodationPackage !== true);
  if (languageCourseCity.trim()) {
    const cityQ = languageCourseCity.trim().toLowerCase();
    filtered = filtered.filter(
      (s) => {
        const city = (s as { languageCourseCity?: string | null }).languageCourseCity;
        return city != null && city.toLowerCase().includes(cityQ);
      }
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);

  return NextResponse.json({
    students: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status : 403 });

  const body = await req.json();
  const { name, studentEmail, gmailAddress, stage, assignedConsultantId, password, loginEmail } = body;
  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const stageSlug = stage ?? "lead";
  const stages = await prisma.stage.findMany({ select: { slug: true } });
  const validSlugs = stages.map((s) => s.slug);
  const finalStage = validSlugs.includes(stageSlug) ? stageSlug : validSlugs[0] ?? "lead";

  const emailForLogin = (loginEmail ?? studentEmail ?? "").toString().trim().toLowerCase();
  if (password) {
    const pwdCheck = validatePassword(password);
    if (!pwdCheck.ok) return NextResponse.json({ error: pwdCheck.error }, { status: 400 });
    if (!emailForLogin) return NextResponse.json({ error: "Şifre belirlemek için giriş e-postası (veya e-posta) gerekli" }, { status: 400 });
    const existing = await prisma.user.findUnique({ where: { email: emailForLogin } });
    if (existing) return NextResponse.json({ error: "Bu e-posta adresi zaten kayıtlı" }, { status: 400 });
  }

  const student = await prisma.student.create({
    data: {
      name,
      studentEmail: studentEmail ?? null,
      gmailAddress: gmailAddress ?? null,
      stage: finalStage,
      assignedConsultantId: assignedConsultantId ?? null,
    },
  });

  if (password && emailForLogin) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email: emailForLogin,
        name: student.name,
        passwordHash,
        role: "STUDENT",
        studentId: student.id,
      },
    });
  }

  const consultantId = student.assignedConsultantId;
  if (consultantId) {
    await createConsultantNotification(
      consultantId,
      "STUDENT_ASSIGNED",
      student.id,
      `Yeni öğrenci atandı: ${student.name}`
    ).catch(() => {});
  }

  return NextResponse.json(student);
}
