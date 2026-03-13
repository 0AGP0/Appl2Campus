import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ serviceId: string; bandId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((session.user as { role?: string }).role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { serviceId, bandId } = await params;
  await prisma.institutionPriceBand.deleteMany({ where: { id: bandId, serviceId } });
  return NextResponse.json({ ok: true });
}
