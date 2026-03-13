"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: (id: string) => `/students/${id}`, label: "Ana Sayfa", icon: "dashboard" },
  { href: (id: string) => `/students/${id}/profil`, label: "Profil", icon: "person" },
  { href: (id: string) => `/students/${id}/belgeler`, label: "Belgeler", icon: "folder" },
  { href: (id: string) => `/students/${id}/vize`, label: "Vize", icon: "badge" },
  { href: (id: string) => `/students/${id}/dil-kursu`, label: "Dil Kursu", icon: "translate" },
  { href: (id: string) => `/students/${id}/basvurular`, label: "Başvurular", icon: "school" },
  { href: (id: string) => `/students/${id}/teklifler`, label: "Teklifler", icon: "request_quote" },
  { href: (id: string) => `/students/${id}/inbox`, label: "Gelen kutusu", icon: "inbox" },
] as const;

export function StudentDetailNav({ studentId }: { studentId: string }) {
  const pathname = usePathname() ?? "";

  return (
    <nav className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-x-auto shrink-0">
      <ul className="flex gap-0 min-w-0">
        {TABS.map((tab) => {
          const href = tab.href(studentId);
          const isInbox = tab.label === "Gelen kutusu";
          const active =
            href === pathname ||
            (isInbox && pathname.startsWith(`/students/${studentId}/inbox`));
          return (
            <li key={tab.label} className="shrink-0">
              <Link
                href={href}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  active
                    ? "border-primary text-primary bg-primary/5"
                    : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <span className="material-icons-outlined text-lg">{tab.icon}</span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
