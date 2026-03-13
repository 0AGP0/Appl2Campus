"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StudentDetailNav } from "./StudentDetailNav";
import { StudentNotesSidebar } from "./StudentNotesSidebar";

export function StudentLayoutContent({
  studentId,
  studentName,
  children,
}: {
  studentId: string;
  studentName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const isInbox = pathname.includes(`/students/${studentId}/inbox`);

  if (isInbox) {
    return (
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <>
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 mb-2 overflow-x-auto shrink-0">
        <Link href="/students" className="hover:text-primary transition-colors shrink-0">
          Öğrenciler
        </Link>
        <span className="material-icons-outlined text-xs shrink-0">chevron_right</span>
        <span className="text-slate-900 dark:text-slate-200 font-medium truncate">
          {studentName}
        </span>
      </nav>
      <StudentDetailNav studentId={studentId} />
      <div className="mt-2 flex-1 flex gap-4 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto">{children}</div>
        <aside className="w-80 shrink-0 flex flex-col border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 overflow-hidden">
          <StudentNotesSidebar studentId={studentId} />
        </aside>
      </div>
    </>
  );
}
