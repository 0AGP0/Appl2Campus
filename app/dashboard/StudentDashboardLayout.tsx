"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutModal } from "@/components/SignOutModal";
import { StudentGlobalBar } from "./StudentGlobalBar";

type Student = {
  id: string;
  name: string;
  studentEmail: string | null;
  gmailAddress: string | null;
  stage: string;
  gmailConnection: { status: string; lastSyncAt: Date | null } | null;
};

export function StudentDashboardLayout({
  children,
  user,
  student,
}: {
  children: React.ReactNode;
  user: { name?: string | null; email?: string | null };
  student: Student;
}) {
  const pathname = usePathname();
  const gmailConnected = student.gmailConnection?.status === "connected";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);

  const NavContent = () => (
    <>
      <div className="p-4 lg:p-6">
        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <span className="material-icons-outlined text-white text-xl">school</span>
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800 dark:text-white">
            Apply2Campus
          </span>
        </Link>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-2">
          Öğrenci Paneli
        </p>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">home</span>
          <span className="font-medium text-sm">Ana Sayfa</span>
        </Link>
        <Link href="/dashboard/duyurular" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/duyurular" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">campaign</span>
          <span className="font-medium text-sm">Duyurular</span>
        </Link>
        <Link href="/dashboard/profilim" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname?.startsWith("/dashboard/profilim") ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">person</span>
          <span className="font-medium text-sm">Profilim</span>
        </Link>
        <Link href="/dashboard/basvurularim" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/basvurularim" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">assignment</span>
          <span className="font-medium text-sm">Başvurularım</span>
        </Link>
        <Link href="/dashboard/offers" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname?.startsWith("/dashboard/offers") ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">description</span>
          <span className="font-medium text-sm">Teklifler</span>
        </Link>
        <Link href="/dashboard/dokumanlar" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/dokumanlar" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">folder</span>
          <span className="font-medium text-sm">Dökümanlar</span>
        </Link>
        <Link href="/dashboard/vize" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/vize" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">badge</span>
          <span className="font-medium text-sm">Vize Bilgileri</span>
        </Link>
        <Link href="/dashboard/dil-kursu" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/dil-kursu" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">translate</span>
          <span className="font-medium text-sm">Dil Kursu</span>
        </Link>
        <Link href="/dashboard/videolar" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/videolar" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">play_circle</span>
          <span className="font-medium text-sm">Eğitim Videoları</span>
        </Link>
        <Link href="/dashboard/settings" onClick={() => setMobileMenuOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${pathname === "/dashboard/settings" ? "bg-primary/10 text-primary" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
          <span className="material-icons-outlined text-xl">settings</span>
          <span className="font-medium text-sm">Ayarlar</span>
        </Link>
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800">
        <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/20 shrink-0">
            <span className="text-sm font-bold text-primary">{user.name?.slice(0, 2).toUpperCase() ?? "U"}</span>
          </div>
          <div className="overflow-hidden min-w-0">
            <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">{user.name ?? user.email ?? "Öğrenci"}</p>
            <p className="text-xs text-slate-500 truncate">Öğrenci</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="mt-2 block w-full text-left text-xs text-slate-500 hover:text-primary transition-colors"
        >
          Çıkış
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background-light dark:bg-background-dark font-display">
      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:h-screen lg:overflow-y-auto bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
        <NavContent />
      </aside>

      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4">
        <button type="button" onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" aria-label="Menüyü aç">
          <span className="material-icons-outlined text-2xl">menu</span>
        </button>
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
          <div className="bg-primary p-1 rounded-lg shrink-0">
            <span className="material-icons-outlined text-white text-lg">school</span>
          </div>
          <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white truncate">Apply2Campus</span>
        </Link>
        <StudentGlobalBar user={user} student={student} onSignOutClick={() => setSignOutOpen(true)} compact />
      </div>

      {mobileMenuOpen && (
        <>
          <div className="lg:hidden fixed inset-0 bg-slate-900/50 z-40 backdrop-blur-sm" aria-hidden onClick={() => setMobileMenuOpen(false)} />
          <aside className="lg:hidden fixed top-0 left-0 bottom-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-50 flex flex-col shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <span className="font-semibold text-slate-800 dark:text-white">Menü</span>
              <button type="button" onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" aria-label="Kapat">
                <span className="material-icons-outlined">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <NavContent />
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 min-h-0 min-w-0 flex flex-col pt-14 lg:pt-0">
        <div className="hidden lg:block">
          <StudentGlobalBar user={user} student={student} onSignOutClick={() => setSignOutOpen(true)} />
        </div>
        <main className="flex-1 min-h-0 min-w-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
