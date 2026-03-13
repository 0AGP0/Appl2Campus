import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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
      images: { orderBy: { sortOrder: "asc" } },
    },
  });

  return NextResponse.json({
    institutions: institutions.map((i) => ({
      ...i,
      services: i.services.map((s) => ({
        ...s,
        prices: s.prices.map((p) => ({
          ...p,
          amount: Number(p.amount),
          startDate: p.startDate.toISOString().slice(0, 10),
          endDate: p.endDate.toISOString().slice(0, 10),
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
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Veritabanı hatası";
    console.error("[api/admin/institutions GET]", e);
    return NextResponse.json({ error: msg, institutions: [] }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = ["UNIVERSITY", "LANGUAGE_COURSE", "ACCOMMODATION", "OTHER"].includes(body.type) ? body.type : "OTHER";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name) return NextResponse.json({ error: "Kurum adı gerekli" }, { status: 400 });

    const institution = await prisma.institution.create({
      data: {
        type,
        name,
        logoUrl: typeof body.logoUrl === "string" ? body.logoUrl.trim() || null : null,
        description: typeof body.description === "string" ? body.description.trim() || null : null,
        address: typeof body.address === "string" ? body.address.trim() || null : null,
      },
    });

    return NextResponse.json({ institution });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Veritabanı hatası";
    console.error("[api/admin/institutions POST]", e);
    return NextResponse.json({ error: `Kurum eklenemedi: ${msg}` }, { status: 500 });
  }
}
