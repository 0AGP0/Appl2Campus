import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isOperationRole } from "@/lib/roles";
import { calculatePriceFromBands } from "@/lib/price-bands";

/** Kurum hizmeti için tarih aralığına veya hafta sayısına göre fiyat bul. */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string }).role ?? "";
  if (!isOperationRole(role) && role !== "CONSULTANT" && role !== "ADMIN") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const url = new URL(req.url);
  const serviceId = url.searchParams.get("serviceId");
  const weeksParam = url.searchParams.get("weeks");
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");

  if (!serviceId) return NextResponse.json({ error: "serviceId gerekli" }, { status: 400 });

  // Hafta sayısına göre hesaplama (haftalık bandlar)
  if (weeksParam != null && weeksParam !== "") {
    const weeks = parseInt(weeksParam, 10);
    if (isNaN(weeks) || weeks < 1) return NextResponse.json({ error: "Geçerli hafta sayısı girin" }, { status: 400 });
    const service = await prisma.institutionService.findUnique({
      where: { id: serviceId },
      include: {
        priceBands: { orderBy: { minWeeks: "asc" } },
        institution: true,
      },
    });
    if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });
    const bands = service.priceBands.map((b) => ({
      minWeeks: b.minWeeks,
      maxWeeks: b.maxWeeks,
      pricePerWeek: Number(b.pricePerWeek),
      currency: b.currency,
    }));
    const result = bands.length > 0 ? calculatePriceFromBands(bands, weeks) : null;
    if (!result) return NextResponse.json({ price: null });
    return NextResponse.json({
      price: {
        amount: result.total,
        currency: result.currency,
        serviceName: service.name,
        institutionName: service.institution.name,
        durationWeeks: weeks,
      },
    });
  }

  // Tarih aralığına göre (mevcut davranış)
  if (!startDate || !endDate) return NextResponse.json({ error: "startDate ve endDate veya weeks gerekli" }, { status: 400 });

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Geçerli tarihler girin" }, { status: 400 });
  }

  const price = await prisma.institutionPrice.findFirst({
    where: {
      serviceId,
      startDate: { lte: start },
      endDate: { gte: end },
    },
    include: {
      service: { include: { institution: true } },
    },
  });

  if (!price) return NextResponse.json({ price: null });
  return NextResponse.json({
    price: {
      id: price.id,
      amount: Number(price.amount),
      currency: price.currency,
      startDate: price.startDate.toISOString().slice(0, 10),
      endDate: price.endDate.toISOString().slice(0, 10),
      serviceName: price.service.name,
      institutionName: price.service.institution.name,
    },
  });
}
