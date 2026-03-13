import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { calculatePriceFromBands } from "@/lib/price-bands";

type Band = { minWeeks: number; maxWeeks: number; pricePerWeek: number; currency: string };

/** Hafta sayısına göre toplam tutarı hesaplar. Bandlar minWeeks'e göre sıralı gelmeli. */
export function calculatePriceFromBands(bands: Band[], weeks: number): { total: number; currency: string } | null {
  if (weeks <= 0 || bands.length === 0) return null;
  let remaining = weeks;
  let total = 0;
  const currency = bands[0]?.currency ?? "EUR";
  for (const b of bands) {
    if (remaining <= 0) break;
    const bandMax = b.maxWeeks === 0 ? 9999 : b.maxWeeks;
    const weeksInBand = Math.min(remaining, bandMax - b.minWeeks + 1);
    if (weeksInBand > 0) {
      total += weeksInBand * b.pricePerWeek;
      remaining -= weeksInBand;
    }
  }
  if (remaining > 0) return null; // Tüm haftalar karşılanamadı
  return { total, currency };
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceId } = await params;
  const service = await prisma.institutionService.findUnique({
    where: { id: serviceId },
    include: { priceBands: { orderBy: { minWeeks: "asc" } } },
  });
  if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });

  const bands = service.priceBands.map((b) => ({
    id: b.id,
    minWeeks: b.minWeeks,
    maxWeeks: b.maxWeeks,
    pricePerWeek: Number(b.pricePerWeek),
    currency: b.currency,
  }));
  return NextResponse.json({ bands });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ serviceId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceId } = await params;
  const service = await prisma.institutionService.findUnique({ where: { id: serviceId } });
  if (!service) return NextResponse.json({ error: "Hizmet bulunamadı" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const minWeeks = Math.max(0, parseInt(String(body.minWeeks ?? 1), 10));
  const maxWeeks = Math.max(0, parseInt(String(body.maxWeeks ?? 0), 10)); // 0 = sınırsız
  const pricePerWeek = parseFloat(String(body.pricePerWeek ?? 0));
  const currency = typeof body.currency === "string" ? body.currency.trim() || "EUR" : "EUR";

  if (isNaN(pricePerWeek) || pricePerWeek < 0) return NextResponse.json({ error: "Geçerli haftalık ücret girin" }, { status: 400 });
  if (maxWeeks > 0 && maxWeeks < minWeeks) return NextResponse.json({ error: "Bitiş haftası başlangıçtan küçük olamaz" }, { status: 400 });

  const count = await prisma.institutionPriceBand.count({ where: { serviceId } });
  const band = await prisma.institutionPriceBand.create({
    data: { serviceId, minWeeks, maxWeeks, pricePerWeek, currency, sortOrder: count },
  });
  return NextResponse.json({
    band: {
      id: band.id,
      minWeeks: band.minWeeks,
      maxWeeks: band.maxWeeks,
      pricePerWeek: Number(band.pricePerWeek),
      currency: band.currency,
    },
  });
}
