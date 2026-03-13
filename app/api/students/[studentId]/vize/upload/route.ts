import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { saveDocument } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

export async function POST(
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
  if (role !== "STUDENT" || sessionStudentId !== studentId)
    return NextResponse.json({ error: "Vize belgesini sadece öğrenci kendisi yükleyebilir" }, { status: 403 });

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "file gerekli" }, { status: 400 });

  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Dosya 20 MB'dan büyük olamaz" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Boş dosya yüklenemez" }, { status: 400 });
  const allowed = file.type && (ALLOWED_TYPES.includes(file.type) || file.type.startsWith("image/"));
  if (file.type && !allowed) return NextResponse.json({ error: "Sadece PDF veya görsel (jpg, png, webp) yükleyebilirsiniz" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const documentId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const originalName = safeFilename(file.name, "vize-belgesi");
  const relativePath = saveDocument(buffer, studentId, "vize-belgesi", originalName, documentId);

  await prisma.student.update({
    where: { id: studentId },
    data: { visaDocumentPath: relativePath },
  });

  return NextResponse.json({
    filePath: relativePath,
    fileName: originalName,
  });
}
