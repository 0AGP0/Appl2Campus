import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { createReadStream, documentExists } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";
import { Readable } from "stream";

const FIELDS = ["registrationDoc", "invoice", "receipt"] as const;
const PATH_FIELDS: Record<(typeof FIELDS)[number], "languageCourseRegistrationDocPath" | "languageCourseInvoicePath" | "languageCourseReceiptPath"> = {
  registrationDoc: "languageCourseRegistrationDocPath",
  invoice: "languageCourseInvoicePath",
  receipt: "languageCourseReceiptPath",
};

export async function GET(
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

  const field = req.nextUrl.searchParams.get("field");
  if (!field || !FIELDS.includes(field as (typeof FIELDS)[number])) {
    return NextResponse.json({ error: "field: registrationDoc | invoice | receipt" }, { status: 400 });
  }
  const pathField = PATH_FIELDS[field as (typeof FIELDS)[number]];

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { [pathField]: true },
  });
  const rawPath = student?.[pathField];
  if (!rawPath || typeof rawPath !== "string" || !documentExists(rawPath)) {
    return NextResponse.json({ error: "Dosya bulunamadı" }, { status: 404 });
  }
  const relativePath: string = rawPath;

  const filename = relativePath.split("/").pop() ?? "dosya";
  const displayName = filename.replace(/^[a-z0-9]+_/i, "") || "dosya";
  const nodeStream = createReadStream(relativePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safeFilename(displayName, "belge"))}`,
      "Content-Type": "application/octet-stream",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
