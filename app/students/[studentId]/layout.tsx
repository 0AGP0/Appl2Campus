import { getServerSession, authOptions } from "@/lib/auth";
import { canAccessStudent } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { StudentDetailNav } from "./StudentDetailNav";

export default async function StudentDetailLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ studentId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) notFound();
  const { studentId } = await params;
  const role = (session.user as { role?: string }).role ?? "CONSULTANT";
  const sessionStudentId = (session.user as { studentId?: string }).studentId;
  const ok = await canAccessStudent(session.user.id, role, studentId, sessionStudentId);
  if (!ok) notFound();

  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: { id: true, name: true },
  });
  if (!student) notFound();

  return (
    <>
      <PageHeader
        backHref="/students"
        backLabel="Öğrenci listesine dön"
        title={student.name}
        subtitle="Öğrenci detayı"
        sticky
      />
      <div className="w-full max-w-[min(100%,1600px)] mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2 overflow-x-auto">
          <Link href="/students" className="hover:text-primary transition-colors shrink-0">
            Öğrenciler
          </Link>
          <span className="material-icons-outlined text-xs shrink-0">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-200 font-medium truncate">
            {student.name}
          </span>
        </nav>
        <StudentDetailNav studentId={studentId} />
      </div>
      <main className="w-full max-w-[min(100%,1600px)] mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {children}
      </main>
    </>
  );
}
