import { getServerSession, authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { InboxClient } from "@/app/students/[studentId]/inbox/InboxClient";

export default async function StudentInboxPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  const studentId = (session.user as { studentId?: string }).studentId;
  if (!studentId) redirect("/login");

  const [student, folders, badges, stages] = await Promise.all([
    prisma.student.findUnique({
      where: { id: studentId },
      select: { id: true, name: true, stage: true, gmailAddress: true, gmailConnection: { select: { status: true } } },
    }),
    prisma.folder.findMany({
      where: { studentId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, fromAddress: true },
    }),
    prisma.badge.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, color: true },
    }),
    prisma.stage.findMany({
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
  ]);
  if (!student) redirect("/login");

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <InboxClient
        studentId={student.id}
        studentName={student.name}
        studentStage={student.stage}
        gmailAddress={student.gmailAddress ?? ""}
        connectionStatus={student.gmailConnection?.status ?? "disconnected"}
        initialLabel="INBOX"
        user={{ name: session.user.name ?? null, email: session.user.email ?? null }}
        inboxBasePath="/dashboard"
        initialFolders={folders}
        initialBadges={badges}
        initialStages={stages}
      />
    </div>
  );
}
