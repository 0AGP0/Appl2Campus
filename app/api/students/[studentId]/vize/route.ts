import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

export async function GET(
  _req: Request,
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
    select: {
      visaInstitution: true,
      visaCity: true,
      visaProgramStartDate: true,
      visaNotes: true,
      visaConsulate: true,
      visaApplicationDate: true,
      visaAppointmentDate: true,
      visaStartDate: true,
      visaEndDate: true,
      visaDocumentPath: true,
    },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
    visaInstitution: student.visaInstitution,
    visaCity: student.visaCity,
    visaProgramStartDate: student.visaProgramStartDate?.toISOString()?.slice(0, 10) ?? null,
    visaNotes: student.visaNotes,
    visaConsulate: student.visaConsulate,
    visaApplicationDate: student.visaApplicationDate?.toISOString()?.slice(0, 10) ?? null,
    visaAppointmentDate: student.visaAppointmentDate?.toISOString()?.slice(0, 10) ?? null,
    visaStartDate: student.visaStartDate?.toISOString()?.slice(0, 10) ?? null,
    visaEndDate: student.visaEndDate?.toISOString()?.slice(0, 10) ?? null,
    visaDocumentPath: student.visaDocumentPath,
  });
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

  const body = await req.json().catch(() => ({}));
  const isStudent = role === "STUDENT" && sessionStudentId === studentId;

  const visaInstitution = typeof body.visaInstitution === "string" ? body.visaInstitution.trim() || null : undefined;
  const visaCity = typeof body.visaCity === "string" ? body.visaCity.trim() || null : undefined;
  const visaProgramStartDate =
    body.visaProgramStartDate !== undefined ? (body.visaProgramStartDate ? new Date(body.visaProgramStartDate) : null) : undefined;
  const visaNotes = typeof body.visaNotes === "string" ? body.visaNotes.trim() || null : undefined;
  const visaConsulate = typeof body.visaConsulate === "string" ? body.visaConsulate.trim() || null : undefined;
  const visaApplicationDate =
    body.visaApplicationDate !== undefined ? (body.visaApplicationDate ? new Date(body.visaApplicationDate) : null) : undefined;
  const visaAppointmentDate =
    body.visaAppointmentDate !== undefined ? (body.visaAppointmentDate ? new Date(body.visaAppointmentDate) : null) : undefined;
  const visaStartDate = body.visaStartDate !== undefined ? (body.visaStartDate ? new Date(body.visaStartDate) : null) : undefined;
  const visaEndDate = body.visaEndDate !== undefined ? (body.visaEndDate ? new Date(body.visaEndDate) : null) : undefined;

  const data: {
    visaInstitution?: string | null;
    visaCity?: string | null;
    visaProgramStartDate?: Date | null;
    visaNotes?: string | null;
    visaConsulate?: string | null;
    visaApplicationDate?: Date | null;
    visaAppointmentDate?: Date | null;
    visaStartDate?: Date | null;
    visaEndDate?: Date | null;
  } = {};

  if (!isStudent) {
    if (visaInstitution !== undefined) data.visaInstitution = visaInstitution;
    if (visaCity !== undefined) data.visaCity = visaCity;
    if (visaProgramStartDate !== undefined) data.visaProgramStartDate = visaProgramStartDate;
    if (visaNotes !== undefined) data.visaNotes = visaNotes;
    if (visaConsulate !== undefined) data.visaConsulate = visaConsulate;
    if (visaApplicationDate !== undefined) data.visaApplicationDate = visaApplicationDate;
    if (visaAppointmentDate !== undefined) data.visaAppointmentDate = visaAppointmentDate;
  }

  if (isStudent) {
    if (visaStartDate !== undefined) data.visaStartDate = visaStartDate;
    if (visaEndDate !== undefined) data.visaEndDate = visaEndDate;
  } else {
    if (visaStartDate !== undefined) data.visaStartDate = visaStartDate;
    if (visaEndDate !== undefined) data.visaEndDate = visaEndDate;
  }

  await prisma.student.update({
    where: { id: studentId },
    data,
  });

  return NextResponse.json({ ok: true });
}
