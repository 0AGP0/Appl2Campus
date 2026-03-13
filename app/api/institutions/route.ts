import { NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";

/** Kurum kartlarını listele. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const institutions = await prisma.institution.findMany({
    orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    include: {
      services: {
        orderBy: { sortOrder: "asc" },
        include: {
          prices: { orderBy: { startDate: "asc" } },
          priceBands: { orderBy: { minWeeks: "asc" } },
        },
      },
    },
  });

  const typeLabels: Record<string, string> = {
    UNIVERSITY: "Üniversite",
    LANGUAGE_COURSE: "Dil Kursu",
    ACCOMMODATION: "Konaklama",
    OTHER: "Diğer",
  };
  const groupLabels: Record<string, string> = {
    EDUCATION: "Eğitim",
    ACCOMMODATION: "Konaklama",
    OTHER: "Diğer",
  };

  return NextResponse.json({
    institutions: institutions.map((i) => ({
      id: i.id,
      type: i.type,
      typeLabel: typeLabels[i.type] ?? i.type,
      name: i.name,
      logoUrl: i.logoUrl,
      description: i.description,
      address: i.address,
      isPartner: i.isPartner,
      contactEmail: i.contactEmail,
      contactPhone: i.contactPhone,
      catalogPdfPath: i.catalogPdfPath,
      services: i.services.map((s) => ({
        id: s.id,
        group: s.group,
        groupLabel: groupLabels[s.group] ?? s.group,
        name: s.name,
        prices: s.prices.map((p) => ({
          id: p.id,
          startDate: p.startDate.toISOString().slice(0, 10),
          endDate: p.endDate.toISOString().slice(0, 10),
          amount: Number(p.amount),
          currency: p.currency,
        })),
        priceBands: s.priceBands.map((b) => ({
          id: b.id,
          minWeeks: b.minWeeks,
          maxWeeks: b.maxWeeks,
          pricePerWeek: Number(b.pricePerWeek),
          currency: b.currency,
        })),
      })),
    })),
  });
}
