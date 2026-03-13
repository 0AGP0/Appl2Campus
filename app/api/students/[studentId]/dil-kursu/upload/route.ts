import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";
import { saveDocument, documentExists } from "@/lib/storage";
import { safeFilename } from "@/lib/sanitize";
import { isOperationRole } from "@/lib/roles";

const FIELDS = ["registrationDoc", "invoice", "receipt"] as const;
const FIELD_SLUGS: Record<(typeof FIELDS)[number], string> = {
  registrationDoc: "dil-kursu-kayit",
  invoice: "dil-kursu-fatura",
  receipt: "dil-kursu-dekont",
};
const STUDENT_PATH_FIELDS: Record<(typeof FIELDS)[number], "languageCourseRegistrationDocPath" | "languageCourseInvoicePath" | "languageCourseReceiptPath"> = {
  registrationDoc: "languageCourseRegistrationDocPath",
  invoice: "languageCourseInvoicePath",
  receipt: "languageCourseReceiptPath",
};

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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

  const formData = await req.formData();
  const field = formData.get("field");
  const file = formData.get("file");
  if (!field || typeof field !== "string" || !FIELDS.includes(field as (typeof FIELDS)[number]) || !(file instanceof File)) {
    return NextResponse.json({ error: "field (registrationDoc|invoice|receipt) ve file gerekli" }, { status: 400 });
  }
  const fieldKey = field as (typeof FIELDS)[number];

  if (fieldKey === "receipt") {
    if (role !== "STUDENT" || sessionStudentId !== studentId)
      return NextResponse.json({ error: "Dekontu sadece öğrenci kendisi yükleyebilir" }, { status: 403 });
  } else {
    if (role === "STUDENT") return NextResponse.json({ error: "Kayıt belgesi ve faturayı operasyon/danışman yükler" }, { status: 403 });
  }

  if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "Dosya 20 MB'dan büyük olamaz" }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "Boş dosya yüklenemez" }, { status: 400 });
  const allowed = file.type && (ALLOWED_TYPES.includes(file.type) || file.type.startsWith("image/"));
  if (file.type && !allowed) return NextResponse.json({ error: "İzin verilmeyen dosya türü" }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const documentId = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const originalName = safeFilename(file.name, "dosya");
  const pathSlug = FIELD_SLUGS[fieldKey];
  const relativePath = saveDocument(buffer, studentId, pathSlug, originalName, documentId);

  const pathField = STUDENT_PATH_FIELDS[fieldKey];
  await prisma.student.update({
    where: { id: studentId },
    data: { [pathField]: relativePath },
  });

  return NextResponse.json({
    field: fieldKey,
    filePath: relativePath,
    fileName: originalName,
  });
}
