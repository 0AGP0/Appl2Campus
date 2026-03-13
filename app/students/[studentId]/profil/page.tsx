import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { CrmCardClient } from "../CrmCardClient";

export default async function StudentProfilPage({
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

  return <CrmCardClient studentId={studentId} editable />;
}
