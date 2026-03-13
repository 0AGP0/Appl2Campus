import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { prisma } from "@/lib/db";

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
  // Öğrenci kendi notlarını göremez; sadece danışman/operasyon/admin
  if (role === "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const notes = await prisma.studentNote.findMany({
    where: { studentId },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    notes: notes.map((n) => ({
      id: n.id,
      type: n.type,
      content: n.content,
      fileName: n.fileName,
      filePath: n.filePath,
      createdAt: n.createdAt,
      author: n.author,
    })),
  });
}

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
  if (role === "STUDENT") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const content = typeof body.content === "string" ? body.content.trim() || null : null;
  const type = body.type === "file" ? "file" : "note";

  if (!content && type === "note") return NextResponse.json({ error: "Not içeriği gerekli" }, { status: 400 });

  const note = await prisma.studentNote.create({
    data: {
      studentId,
      authorId: session.user.id,
      type,
      content,
      fileName: typeof body.fileName === "string" ? body.fileName : null,
      filePath: typeof body.filePath === "string" ? body.filePath : null,
    },
    include: {
      author: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({
    id: note.id,
    type: note.type,
    content: note.content,
    fileName: note.fileName,
    filePath: note.filePath,
    createdAt: note.createdAt,
    author: note.author,
  });
}
