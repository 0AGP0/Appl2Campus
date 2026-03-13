"use client";

import { useState } from "react";
import Link from "next/link";
import { SignOutModal } from "./SignOutModal";
import { isOperationRole } from "@/lib/roles";

export type AppSidebarUser = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string;
};

type AppSidebarProps = {
  user: AppSidebarUser;
  pathname: string;
  onNavigate?: () => void;
  /** drawer modunda üstte "Menü" + kapat butonu gösterilir */
  variant?: "desktop" | "drawer";
};

function NavLink({
  href,
  label,
  icon,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  active: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
        active
          ? "bg-primary/10 text-primary font-semibold shadow-sm"
          : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200"
      }`}
    >
      <span
        className={`material-icons-outlined text-xl transition-transform ${active ? "scale-110" : ""}`}
      >
        {icon}
      </span>
      <span className="font-medium text-sm">{label}</span>
    </Link>
  );
}

export function AppSidebar({ user, pathname, onNavigate, variant = "desktop" }: AppSidebarProps) {
  const isAdmin = user.role === "ADMIN";
  const isOperation = isOperationRole(user.role);
  const [signOutOpen, setSignOutOpen] = useState(false);

  return (
    <>
      <SignOutModal open={signOutOpen} onClose={() => setSignOutOpen(false)} />
      {variant === "drawer" && (
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <span className="font-semibold text-slate-800 dark:text-white">Menü</span>
          <button
            type="button"
            onClick={onNavigate}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            aria-label="Menüyü kapat"
          >
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
      )}
      <div className="p-4 lg:p-6 shrink-0">
        <Link
          href={isAdmin ? "/admin" : isOperation ? "/operasyon/inbox" : "/panel"}
          onClick={onNavigate}
          className="flex items-center gap-3 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/25 transition-shadow">
            <span className="material-icons-outlined text-white text-xl">school</span>
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight text-slate-800 dark:text-white block">
              Apply2Campus
            </span>
            <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {isAdmin ? "Admin" : isOperation ? "Operasyon" : "Danışman"}
            </span>
          </div>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1 min-h-0 overflow-y-auto">
        {isAdmin ? (
          <>
            <NavLink
              href="/admin"
              label="Özet"
              icon="dashboard"
              active={pathname === "/admin"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/danismanlar"
              label="Danışmanlar"
              icon="person"
              active={pathname === "/admin/danismanlar"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/ogrenciler"
              label="Öğrenciler"
              icon="school"
              active={pathname === "/admin/ogrenciler"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/asamalar"
              label="Aşamalar"
              icon="label"
              active={pathname === "/admin/asamalar"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/katalog"
              label="Katalog"
              icon="menu_book"
              active={pathname === "/admin/katalog"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/kurumlar"
              label="Kurum Kartları"
              icon="business"
              active={pathname === "/admin/kurumlar"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/admin/duyurular"
              label="Duyurular"
              icon="campaign"
              active={pathname === "/admin/duyurular"}
              onNavigate={onNavigate}
            />
          </>
        ) : isOperation ? (
          <>
            <NavLink
              href="/panel"
              label="Ana Sayfa"
              icon="dashboard"
              active={pathname === "/panel"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/students"
              label="Öğrenci listesi"
              icon="people_alt"
              active={pathname === "/students" || !!pathname.match(/^\/students\/[^/]+$/)}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/operasyon/inbox"
              label="Tek Inbox"
              icon="inbox"
              active={pathname === "/operasyon/inbox" || pathname.startsWith("/operasyon/inbox/")}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/duyurular"
              label="Duyurular"
              icon="campaign"
              active={pathname === "/panel/duyurular"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/gorevler"
              label="Görevler"
              icon="assignment"
              active={pathname === "/panel/gorevler"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/kataloglar"
              label="Dil kursu katalogları"
              icon="menu_book"
              active={pathname === "/panel/kataloglar"}
              onNavigate={onNavigate}
            />
          </>
        ) : (
          <>
            <NavLink
              href="/panel"
              label="Ana Sayfa"
              icon="dashboard"
              active={pathname === "/panel"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/students"
              label="Öğrenci listesi"
              icon="people_alt"
              active={pathname === "/students" || !!pathname.match(/^\/students\/[^/]+$/)}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/musait-saatler"
              label="Müsait saatler"
              icon="event"
              active={pathname === "/panel/musait-saatler"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/duyurular"
              label="Duyurular"
              icon="campaign"
              active={pathname === "/panel/duyurular"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/gorevler"
              label="Görevler"
              icon="assignment"
              active={pathname === "/panel/gorevler"}
              onNavigate={onNavigate}
            />
            <NavLink
              href="/panel/kataloglar"
              label="Dil kursu katalogları"
              icon="menu_book"
              active={pathname === "/panel/kataloglar"}
              onNavigate={onNavigate}
            />
          </>
        )}
      </nav>
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
        <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800/80 p-3.5 rounded-2xl flex items-center gap-3 border border-slate-200/80 dark:border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
            <span className="text-sm font-bold text-primary">
              {user.name?.slice(0, 2).toUpperCase() ?? "U"}
            </span>
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <p className="text-sm font-semibold truncate text-slate-800 dark:text-slate-200">
              {user.name ?? "Kullanıcı"}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {isAdmin ? "Yönetici" : isOperation ? "Operasyon" : "Danışman"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSignOutOpen(true)}
          className="mt-2.5 block w-full text-left text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-primary transition-colors py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 px-2"
        >
          Çıkış
        </button>
      </div>
    </>
  );
}
