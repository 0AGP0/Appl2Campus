import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createConsultantNotification } from "@/lib/notifications";

function extractCityFromAddress(address: string): string | null {
  const trimmed = address.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
  return parts.length > 0 ? parts[parts.length - 1] : trimmed;
}

/** Öğrenci teklife kabul/red/revize iste yanıtı verir. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string; offerId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  if (role !== "STUDENT" || sessionStudentId !== (await params).studentId)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { studentId, offerId } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, note } = body as { status?: string; note?: string };
  const validStatus = ["ACCEPTED", "REJECTED", "REVISION_REQUESTED"].find((s) => s === status);
  if (!validStatus) return NextResponse.json({ error: "status: ACCEPTED, REJECTED veya REVISION_REQUESTED olmalı" }, { status: 400 });

  const offer = await prisma.offer.findFirst({
    where: { id: offerId, studentId },
    include: { student: { select: { assignedConsultantId: true, name: true } } },
  });
  if (!offer) return NextResponse.json({ error: "Teklif bulunamadı" }, { status: 404 });
  if (offer.status === "ACCEPTED" || offer.status === "REJECTED")
    return NextResponse.json({ error: "Bu teklif zaten yanıtlanmış" }, { status: 400 });

  await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: validStatus,
      respondedAt: new Date(),
      responseNote: note ? String(note).trim() : null,
    },
  });

  if (validStatus === "ACCEPTED") {
    const offerWithItems = await prisma.offer.findUnique({
      where: { id: offerId },
      include: {
        items: { where: { startDate: { not: null } }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (offerWithItems?.items?.length) {
      const institutionIds = [...new Set(offerWithItems.items.map((i) => i.institutionId).filter(Boolean))] as string[];
      const institutions = institutionIds.length
        ? await prisma.institution.findMany({ where: { id: { in: institutionIds } }, select: { id: true, type: true, name: true, address: true } })
        : [];
      const byInstId = Object.fromEntries(institutions.map((i) => [i.id, i]));
      let visaProgramStartDate: Date | null = null;
      let visaInstitution: string | null = null;
      let visaCity: string | null = null;
      let languageCourseStartDate: Date | null = null;
      let languageCourseInstitutionId: string | null = null;
      let languageCourseName: string | null = null;
      let accommodationStartDate: Date | null = null;
      for (const item of offerWithItems.items) {
        if (!item.startDate) continue;
        const inst = item.institutionId ? byInstId[item.institutionId] : null;
        const type = inst?.type;
        if (type === "UNIVERSITY") {
          if (!visaProgramStartDate) {
            visaProgramStartDate = item.startDate;
            visaInstitution = inst?.name ?? item.schoolName ?? null;
            visaCity = (item.city && item.city.trim()) ? item.city.trim() : (inst?.address ? extractCityFromAddress(inst.address) : null);
          }
        } else if (type === "LANGUAGE_COURSE") {
          if (!languageCourseStartDate) {
            languageCourseStartDate = item.startDate;
            languageCourseInstitutionId = inst?.id ?? null;
            languageCourseName = inst?.name ?? item.schoolName ?? item.program ?? null;
          }
        } else if (type === "ACCOMMODATION") {
          if (!accommodationStartDate) accommodationStartDate = item.startDate;
        } else if (!inst && item.programGroup) {
          const g = String(item.programGroup).toLowerCase();
          if (g.includes("konaklama") && !accommodationStartDate) accommodationStartDate = item.startDate;
          else if ((g.includes("eğitim") || g.includes("dil")) && !languageCourseStartDate) languageCourseStartDate = item.startDate;
          else if (!visaProgramStartDate) visaProgramStartDate = item.startDate;
        } else if (!visaProgramStartDate) {
          visaProgramStartDate = item.startDate;
          visaInstitution = item.schoolName ?? null;
        }
      }
      const updateData: {
        visaProgramStartDate?: Date | null;
        visaInstitution?: string | null;
        visaCity?: string | null;
        languageCourseStartDate?: Date | null;
        languageCourseInstitutionId?: string | null;
        languageCourseName?: string | null;
        accommodationStartDate?: Date | null;
      } = {};
      if (visaProgramStartDate) {
        updateData.visaProgramStartDate = visaProgramStartDate;
        if (visaInstitution != null) updateData.visaInstitution = visaInstitution;
        if (visaCity != null) updateData.visaCity = visaCity;
      }
      if (languageCourseStartDate) {
        updateData.languageCourseStartDate = languageCourseStartDate;
        if (languageCourseInstitutionId != null) updateData.languageCourseInstitutionId = languageCourseInstitutionId;
        if (languageCourseName != null) updateData.languageCourseName = languageCourseName;
      }
      if (accommodationStartDate) updateData.accommodationStartDate = accommodationStartDate;
      if (Object.keys(updateData).length > 0) {
        await prisma.student.update({
          where: { id: studentId },
          data: updateData,
        });
      }
    }
  }

  const consultantId = offer.student.assignedConsultantId;
  if (consultantId) {
    const msg =
      validStatus === "ACCEPTED"
        ? `Öğrenci teklifi kabul etti: ${offer.title}`
        : validStatus === "REJECTED"
          ? `Öğrenci teklifi reddetti: ${offer.title}`
          : `Öğrenci revizyon istedi: ${offer.title}`;
    await createConsultantNotification(consultantId, "STUDENT_UPDATED", studentId, msg).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
