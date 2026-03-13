import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createConsultantNotification } from "@/lib/notifications";
import { isOperationRole } from "@/lib/roles";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      consultant: { select: { id: true, name: true, email: true } },
      gmailConnection: true,
    },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { gmailConnection, ...rest } = student;
  const safe = {
    ...rest,
    gmailConnection: gmailConnection
      ? {
          id: gmailConnection.id,
          status: gmailConnection.status,
          lastSyncAt: gmailConnection.lastSyncAt,
          provider: gmailConnection.provider,
        }
      : null,
  };
  return NextResponse.json(safe);
}

async function getValidStageSlugs(): Promise<string[]> {
  const stages = await prisma.stage.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true },
  });
  return stages.map((s) => s.slug);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const isAdmin = role === "ADMIN";
  const isOwnStudent = role === "STUDENT" && sessionStudentId === studentId;
  const isConsultantOrOp = role === "CONSULTANT" || isOperationRole(role);
  const validSlugs = await getValidStageSlugs();
  const stageOk = body.stage != null && validSlugs.includes(String(body.stage));
  const data = isAdmin
    ? {
        ...(body.name != null && { name: body.name }),
        ...(body.studentEmail !== undefined && { studentEmail: body.studentEmail }),
        ...(body.gmailAddress !== undefined && { gmailAddress: body.gmailAddress }),
        ...(stageOk && { stage: body.stage }),
        ...(body.assignedConsultantId !== undefined && {
          assignedConsultantId: body.assignedConsultantId === "" || body.assignedConsultantId === null ? null : body.assignedConsultantId,
        }),
        ...(body.accommodationPackage !== undefined && { accommodationPackage: !!body.accommodationPackage }),
        ...(body.languageCourseCity !== undefined && { languageCourseCity: body.languageCourseCity === "" ? null : body.languageCourseCity }),
        ...(body.languageCourseName !== undefined && { languageCourseName: body.languageCourseName === "" ? null : body.languageCourseName }),
        ...(body.languageCourseStartDate !== undefined && { languageCourseStartDate: body.languageCourseStartDate ? new Date(body.languageCourseStartDate) : null }),
        ...(body.languageCourseInstitutionId !== undefined && { languageCourseInstitutionId: body.languageCourseInstitutionId === "" ? null : body.languageCourseInstitutionId }),
        ...(body.languageCoursePostponements !== undefined && { languageCoursePostponements: body.languageCoursePostponements }),
      }
    : isOwnStudent
      ? {
          ...(body.name != null && String(body.name).trim() && { name: String(body.name).trim() }),
          ...(body.studentEmail !== undefined && { studentEmail: body.studentEmail === "" ? null : body.studentEmail }),
        }
      : isConsultantOrOp
        ? {
            ...(stageOk && { stage: body.stage }),
            ...(body.accommodationPackage !== undefined && { accommodationPackage: !!body.accommodationPackage }),
            ...(body.languageCourseCity !== undefined && { languageCourseCity: body.languageCourseCity === "" ? null : body.languageCourseCity }),
            ...(body.languageCourseName !== undefined && { languageCourseName: body.languageCourseName === "" ? null : body.languageCourseName }),
            ...(body.languageCourseStartDate !== undefined && { languageCourseStartDate: body.languageCourseStartDate ? new Date(body.languageCourseStartDate) : null }),
            ...(body.languageCourseInstitutionId !== undefined && { languageCourseInstitutionId: body.languageCourseInstitutionId === "" ? null : body.languageCourseInstitutionId }),
            ...(body.languageCoursePostponements !== undefined && { languageCoursePostponements: body.languageCoursePostponements }),
          }
        : stageOk
          ? { stage: body.stage }
          : {};
  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No valid update" }, { status: 400 });

  const previous = await prisma.student.findUnique({
    where: { id: studentId },
    select: { assignedConsultantId: true, name: true },
  });
  const student = await prisma.student.update({
    where: { id: studentId },
    data,
  });

  if (isAdmin) {
    const newConsultantId = student.assignedConsultantId ?? null;
    const prevConsultantId = previous?.assignedConsultantId ?? null;
    if (newConsultantId && newConsultantId !== prevConsultantId) {
      await createConsultantNotification(
        newConsultantId,
        "STUDENT_ASSIGNED",
        student.id,
        `Yeni öğrenci atandı: ${student.name}`
      ).catch(() => {});
    } else if (
      newConsultantId &&
      (data.name !== undefined || data.studentEmail !== undefined || data.gmailAddress !== undefined || data.stage !== undefined)
    ) {
      await createConsultantNotification(
        newConsultantId,
        "STUDENT_UPDATED",
        student.id,
        `Öğrenci bilgisi güncellendi: ${student.name}`
      ).catch(() => {});
    }
  }

  return NextResponse.json(student);
}

/** Admin: Öğrenciyi siler (giriş hesabı varsa o da silinir). */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentId } = await params;

  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) return NextResponse.json({ error: "Öğrenci bulunamadı" }, { status: 404 });

  await prisma.student.delete({ where: { id: studentId } });

  return NextResponse.json({ ok: true });
}
