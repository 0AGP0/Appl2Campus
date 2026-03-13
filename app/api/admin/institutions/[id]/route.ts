import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data: {
    type?: "UNIVERSITY" | "LANGUAGE_COURSE" | "ACCOMMODATION" | "OTHER";
    name?: string;
    logoUrl?: string | null;
    description?: string | null;
    address?: string | null;
    isPartner?: boolean;
    contactEmail?: string | null;
    contactPhone?: string | null;
  } = {};
  if (["UNIVERSITY", "LANGUAGE_COURSE", "ACCOMMODATION", "OTHER"].includes(body.type)) data.type = body.type as "UNIVERSITY" | "LANGUAGE_COURSE" | "ACCOMMODATION" | "OTHER";
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if ("logoUrl" in body) data.logoUrl = typeof body.logoUrl === "string" ? body.logoUrl.trim() || null : null;
  if ("description" in body) data.description = typeof body.description === "string" ? body.description.trim() || null : null;
  if ("address" in body) data.address = typeof body.address === "string" ? body.address.trim() || null : null;
  if ("isPartner" in body) data.isPartner = !!body.isPartner;
  if ("contactEmail" in body) data.contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() || null : null;
  if ("contactPhone" in body) data.contactPhone = typeof body.contactPhone === "string" ? body.contactPhone.trim() || null : null;

  const institution = await prisma.institution.update({ where: { id }, data });
  return NextResponse.json({ institution });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await ctx.params;
  await prisma.institution.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
