import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { StudentBelgelerFullClient } from "../StudentBelgelerFullClient";

export default async function StudentBelgelerPage({
  params,
}: {
  params: Promise<{ studentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <StudentBelgelerFullClient studentId={studentId} />
    </div>
  );
}
