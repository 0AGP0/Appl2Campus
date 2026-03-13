import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

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
    select: {
      languageCourseName: true,
      languageCourseStartDate: true,
      languageCourseInstitutionId: true,
      languageCourseRegistrationDocPath: true,
      languageCourseInvoicePath: true,
      languageCourseReceiptPath: true,
      languageCoursePostponements: true,
      languageCourseInstitution: true,
    },
  });
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const inst = student.languageCourseInstitution;
  return NextResponse.json({
    languageCourseName: student.languageCourseName,
    languageCourseStartDate: student.languageCourseStartDate?.toISOString().slice(0, 10) ?? null,
    languageCourseInstitutionId: student.languageCourseInstitutionId,
    languageCourseInstitution: inst
      ? {
          id: inst.id,
          name: inst.name,
          address: inst.address,
          contactEmail: inst.contactEmail,
          contactPhone: inst.contactPhone,
          isPartner: inst.isPartner,
          catalogPdfPath: inst.catalogPdfPath,
        }
      : null,
    languageCourseRegistrationDocPath: student.languageCourseRegistrationDocPath,
    languageCourseInvoicePath: student.languageCourseInvoicePath,
    languageCourseReceiptPath: student.languageCourseReceiptPath,
    languageCoursePostponements: student.languageCoursePostponements as { from: string; to: string }[] | null,
  });
}
