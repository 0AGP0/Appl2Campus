import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createReadStream, documentExists } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";
import { Readable } from "stream";

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
    select: { visaDocumentPath: true },
  });
  const path = student?.visaDocumentPath;
  if (!path || typeof path !== "string" || !documentExists(path))
    return NextResponse.json({ error: "Vize belgesi bulunamadı" }, { status: 404 });

  const filename = path.split("/").pop() ?? "vize-belgesi";
  const displayName = filename.replace(/^[a-z0-9]+_/i, "") || "vize-belgesi";
  const nodeStream = createReadStream(path);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename(displayName, "vize-belgesi"))}`,
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
