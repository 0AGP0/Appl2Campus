"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PanelLayout } from "@/components/PanelLayout";

const ROLE_LABELS: Record<string, string> = {
  CONSULTANT: "Danışman",
  OPERATION_UNIVERSITY: "Üniversite Sorumlusu",
  OPERATION_ACCOMMODATION: "Konaklama & Dil Kursu",
  OPERATION_VISA: "Vize Sorumlusu",
};

type Consultant = {
  id: string;
  name: string | null;
  email: string | null;
  role?: string;
  _count?: { assignedStudents: number };
  assignedStudents?: { id: string; name: string }[];
  auditLogs?: { createdAt: string; message: string | null }[];
};

function initials(str: string | null | undefined): string {
  if (!str?.trim()) return "—";
  const parts = str.trim().split(/\s+/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase().slice(0, 2);
  return str.slice(0, 2).toUpperCase();
}

function formatAgo(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffM = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffM / 60);
  const diffD = Math.floor(diffH / 24);
  if (diffM < 1) return "az önce";
  if (diffM < 60) return `${diffM} dk önce`;
  if (diffH < 24) return `${diffH} sa önce`;
  if (diffD < 7) return `${diffD} gün önce`;
  return d.toLocaleDateString("tr-TR");
}

export function AdminConsultantsClient() {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<string>("CONSULTANT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [addingDemoConsultant, setAddingDemoConsultant] = useState(false);

  function fetchConsultants() {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => setConsultants(data.consultants ?? []))
      .catch(() => setConsultants([]));
  }

  useEffect(() => {
    fetchConsultants();
  }, []);

  async function addDemoConsultant() {
    setAddingDemoConsultant(true);
    setError("");
    try {
      const res = await fetch("/api/admin/ensure-demo-consultant", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        fetchConsultants();
      } else {
        setError(data.error ?? "Demo danışman eklenemedi");
      }
    } catch {
      setError("Bağlantı hatası");
    }
    setAddingDemoConsultant(false);
  }

  const filtered = useMemo(() => {
    if (!search.trim()) return consultants;
    const q = search.trim().toLowerCase();
    return consultants.filter(
      (c) =>
        (c.name ?? "").toLowerCase().includes(q) ||
        (c.email ?? "").toLowerCase().includes(q)
    );
  }, [consultants, search]);

  const stats = useMemo(() => {
    const total = consultants.length;
    const consultantsOnly = consultants.filter((c) => c.role === "CONSULTANT");
    const totalStudents = consultantsOnly.reduce(
      (s, c) => s + (c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0),
      0
    );
    const withZero = consultantsOnly.filter(
      (c) => (c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0) === 0
    ).length;
    const consultantCount = consultantsOnly.length;
    const avg = consultantCount > 0 ? (totalStudents / consultantCount).toFixed(1) : "0";
    return { total, totalStudents, withZero, avg };
  }, [consultants]);

  const consultantsWithNoStudents = useMemo(
    () =>
      consultants.filter(
        (c) => (c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0) === 0
      ),
    [consultants]
  );

  async function handleDeleteConsultant(c: Consultant) {
    const count = c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0;
    const isConsultant = c.role === "CONSULTANT";
    const msg = isConsultant && count > 0
      ? `"${c.name ?? c.email}" kullanıcısını silmek istediğinize emin misiniz? Atanan ${count} öğrencinin danışman ataması kaldırılacak.`
      : `"${c.name ?? c.email}" kullanıcısını silmek istediğinize emin misiniz?`;
    if (!confirm(msg)) return;
    setDeletingId(c.id);
    const res = await fetch(`/api/users/${c.id}`, { method: "DELETE" });
    setDeletingId(null);
    if (res.ok) fetchConsultants();
    else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "Silinemedi");
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim() || null,
        email: email.trim(),
        password,
        role: newRole,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setModalOpen(false);
      setName("");
      setEmail("");
      setPassword("");
      setNewRole("CONSULTANT");
      fetchConsultants();
    } else {
      setError(data.error ?? "Kullanıcı oluşturulamadı");
    }
  }

  return (
    <PanelLayout
      title="Danışmanlar"
      subtitle="Danışman ve operasyon hesapları"
      actions={
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="btn-primary-panel w-full sm:w-auto"
        >
          <span className="material-icons-outlined text-lg">person_add</span>
          Kullanıcı ekle
        </button>
      }
    >
      {/* Özet kartları */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 mt-4">
        <div className="panel-stat-card border-t-blue-500 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <span className="material-icons-outlined text-2xl">groups</span>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Toplam kullanıcı
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.total}
          </p>
        </div>
        <div className="panel-stat-card border-t-emerald-500 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <span className="material-icons-outlined text-2xl">school</span>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Atanmış öğrenci
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.totalStudents}
          </p>
        </div>
        <div className="panel-stat-card border-t-violet-500 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <span className="material-icons-outlined text-2xl">analytics</span>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ort. öğrenci / danışman
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.avg}
          </p>
        </div>
        <div className="panel-stat-card border-t-amber-500 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <span className="material-icons-outlined text-2xl">person_off</span>
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Öğrencisiz danışman
          </p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
            {stats.withZero}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6">
          {/* Liste boşsa demo danışman ekle */}
          {consultants.length === 0 && (
            <div className="panel-card p-6 border-2 border-dashed border-primary/30 bg-primary/5 dark:bg-primary/10 rounded-2xl">
              <p className="text-slate-700 dark:text-slate-300 font-medium mb-2">Demo danışman yok</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                Tek tıkla demo danışman (sarah@educonsult.local, şifre: password123) eklenir; listede hemen görünür.
              </p>
              <button
                type="button"
                onClick={addDemoConsultant}
                disabled={addingDemoConsultant}
                className="btn-primary-panel disabled:opacity-50"
              >
                {addingDemoConsultant ? "Ekleniyor…" : "Demo danışman ekle"}
              </button>
              {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
            </div>
          )}

          {/* Arama */}
          <div className="panel-card p-4">
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <input
                type="text"
                placeholder="Danışman adı veya e-posta ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-panel pl-11"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded"
                >
                  <span className="material-icons-outlined text-lg">close</span>
                </button>
              )}
            </div>
            {search && (
              <p className="text-xs text-slate-500 mt-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300">{filtered.length}</span> danışman listeleniyor
              </p>
            )}
          </div>

          {/* Mobil: kart listesi */}
          <div className="md:hidden space-y-3">
            {filtered.length === 0 ? (
              <div className="panel-card p-6 text-center text-slate-500">
                {consultants.length === 0
                  ? "Henüz kullanıcı yok. Kullanıcı ekle ile danışman veya operasyon hesabı oluşturun."
                  : "Arama kriterine uyan kullanıcı bulunamadı."}
              </div>
            ) : (
              filtered.map((c) => {
                const count = c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0;
                const displayName = c.name ?? c.email ?? "—";
                const lastLog = c.auditLogs?.[0];
                return (
                  <div
                    key={c.id}
                    className="panel-card p-4 flex items-center gap-4"
                  >
                    <Link
                      href={`/admin/ogrenciler?consultantId=${c.id}`}
                      className="flex items-center gap-4 flex-1 min-w-0 active:opacity-90"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                        {initials(displayName)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {displayName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {c.email}
                        </p>
                        <p className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400">
                            {ROLE_LABELS[c.role ?? "CONSULTANT"] ?? c.role}
                          </span>
                          {lastLog && <span className="text-xs text-slate-500">{formatAgo(lastLog.createdAt)}</span>}
                        </p>
                      </div>
                      <div className="shrink-0 flex items-center gap-1 text-primary font-semibold text-sm">
                        <span className="tabular-nums">{c.role === "CONSULTANT" ? `${count} öğrenci` : "—"}</span>
                        <span className="material-icons-outlined text-lg">chevron_right</span>
                      </div>
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDeleteConsultant(c)}
                      disabled={deletingId === c.id}
                      className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 shrink-0"
                      title="Kullanıcıyı sil"
                    >
                      <span className="material-icons-outlined text-lg">delete</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Masaüstü: tablo */}
          <div className="hidden md:block panel-card overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="table-header-row">
                  <th className="table-th">Danışman</th>
                  <th className="table-th">E-posta</th>
                  <th className="table-th">Atanan öğrenciler</th>
                  <th className="table-th">Son aktivite</th>
                  <th className="table-th text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/80">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-td text-center text-slate-500 py-16 bg-slate-50/30 dark:bg-slate-800/20">
                      {consultants.length === 0
                        ? "Henüz kullanıcı yok. Kullanıcı ekle ile danışman veya operasyon hesabı oluşturun."
                        : "Arama kriterine uyan kullanıcı bulunamadı."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((c) => {
                    const count = c._count?.assignedStudents ?? c.assignedStudents?.length ?? 0;
                    const displayName = c.name ?? c.email ?? "—";
                    const lastLog = c.auditLogs?.[0];
                    return (
                      <tr key={c.id} className="table-row-hover table-row-zebra">
                        <td className="table-td">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                              {initials(displayName)}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {displayName}
                              </p>
                              <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                                {ROLE_LABELS[c.role ?? "CONSULTANT"] ?? c.role}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="table-td text-slate-600 dark:text-slate-400">
                          {c.email}
                        </td>
                        <td className="table-td">
                          {c.role === "CONSULTANT" ? (
                            <Link
                              href={`/admin/ogrenciler?consultantId=${c.id}`}
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
                            >
                              <span className="tabular-nums">{count} öğrenci</span>
                              <span className="material-icons-outlined text-base">arrow_forward</span>
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="table-td text-slate-500 text-xs">
                          {lastLog ? (
                            <span title={lastLog.message ?? undefined}>
                              {formatAgo(lastLog.createdAt)}
                              {lastLog.message && (
                                <span className="block truncate max-w-[180px] text-slate-400 mt-0.5">
                                  {lastLog.message}
                                </span>
                              )}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="table-td text-right">
                          <div className="flex items-center justify-end gap-2">
                            {c.role === "CONSULTANT" && (
                              <Link
                                href={`/admin/ogrenciler?consultantId=${c.id}`}
                                className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1"
                              >
                                Öğrenciler
                                <span className="material-icons-outlined text-base">arrow_forward</span>
                              </Link>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDeleteConsultant(c)}
                              disabled={deletingId === c.id}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 disabled:opacity-50"
                              title="Kullanıcıyı sil"
                            >
                              <span className="material-icons-outlined text-lg">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Alt bilgi kartı */}
          <div className="panel-card p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <span className="material-icons-outlined text-2xl">info</span>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1">Öğrenci atama</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Danışmanlara öğrenci atamak için <Link href="/admin/ogrenciler" className="text-primary font-medium hover:underline">Öğrenciler</Link> sayfasına gidin,
                  listeden öğrenciyi seçip &quot;Atanan danışman&quot; alanından ilgili danışmanı seçebilirsiniz.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sağ sidebar */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="panel-card p-6 sticky top-24">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-sm">insights</span>
              Hızlı bilgi
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Öğrencisiz danışmanlar</p>
                {consultantsWithNoStudents.length === 0 ? (
                  <p className="text-sm text-slate-500">Tüm danışmanlara en az bir öğrenci atanmış.</p>
                ) : (
                  <ul className="space-y-2">
                    {consultantsWithNoStudents.slice(0, 5).map((c) => (
                      <li key={c.id}>
                        <Link
                          href={`/admin/ogrenciler?consultantId=${c.id}`}
                          className="text-sm font-medium text-primary hover:underline flex items-center gap-2"
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 flex items-center justify-center text-[10px] font-bold">
                            {initials(c.name ?? c.email)}
                          </span>
                          {c.name ?? c.email ?? "—"}
                        </Link>
                      </li>
                    ))}
                    {consultantsWithNoStudents.length > 5 && (
                      <li className="text-xs text-slate-500">
                        +{consultantsWithNoStudents.length - 5} daha
                      </li>
                    )}
                  </ul>
                )}
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/admin/ogrenciler"
                  className="flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                >
                  <span className="material-icons-outlined text-lg">school</span>
                  Tüm öğrenciler
                </Link>
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary transition-colors w-full"
                >
                  <span className="material-icons-outlined text-lg">person_add</span>
                  Yeni danışman ekle
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="panel-card-inner w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-5">
              Yeni kullanıcı
            </h3>
            <form onSubmit={handleCreate} className="space-y-5">
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-4 py-3 rounded-xl">
                  {error}
                </p>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Rol *
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input-panel w-full"
                >
                  <option value="CONSULTANT">{ROLE_LABELS.CONSULTANT}</option>
                  <option value="OPERATION_UNIVERSITY">{ROLE_LABELS.OPERATION_UNIVERSITY}</option>
                  <option value="OPERATION_ACCOMMODATION">{ROLE_LABELS.OPERATION_ACCOMMODATION}</option>
                  <option value="OPERATION_VISA">{ROLE_LABELS.OPERATION_VISA}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Ad
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-panel"
                  placeholder="İsteğe bağlı"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  E-posta *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-panel"
                  placeholder="danisman@kurum.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Şifre *
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-panel"
                  placeholder="En az 6 karakter"
                  minLength={6}
                  required
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalOpen(false);
                    setError("");
                  }}
                  className="btn-secondary-panel flex-1"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-panel flex-1 disabled:opacity-50"
                >
                  {loading ? "Kaydediliyor…" : "Oluştur"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </PanelLayout>
  );
}
