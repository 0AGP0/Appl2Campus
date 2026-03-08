import { NextRequest, NextResponse } from "next/server";
import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { checkSyncRateLimitAsync, recordSyncAttempt } from "@/lib/rate-limit";
import { syncStudentInbox } from "@/lib/gmail";
import { prisma } from "@/lib/db";

export async function POST(
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

  if (!(await checkSyncRateLimitAsync(studentId))) {
    return NextResponse.json(
      { error: "Çok sık senkronizasyon denemesi. Lütfen 5 dakika sonra tekrar deneyin." },
      { status: 429 }
    );
  }

  const conn = await prisma.gmailConnection.findUnique({
    where: { studentId },
  });
  if (!conn || conn.status === "disconnected") {
    return NextResponse.json(
      { error: "No active Gmail connection. Connect Gmail first." },
      { status: 400 }
    );
  }

  recordSyncAttempt(studentId);
  const result = await syncStudentInbox(studentId);
  return NextResponse.json(result);
}
