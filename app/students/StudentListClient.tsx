"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Student = {
  id: string;
  name: string;
  studentEmail: string | null;
  gmailAddress: string | null;
  stage: string;
  accommodationPackage?: boolean;
  languageCourseCity?: string | null;
  assignedConsultantId: string | null;
  consultant: { id: string; name: string | null; email: string | null } | null;
  gmailConnection: { status: string; lastSyncAt: string | null } | null;
  createdAt: string;
};

type ConsultantsResponse = { consultants: { id: string; name: string | null; email: string | null }[] };

export function StudentListClient({
  isAdmin,
  defaultConsultantId,
}: {
  isAdmin: boolean;
  defaultConsultantId?: string;
}) {
  const [students, setStudents] = useState<Student[]>([]);
  const [consultants, setConsultants] = useState<{ id: string; name: string | null; email: string | null }[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [search, setSearch] = useState("");
  const [stage, setStage] = useState("");
  const [stageNot, setStageNot] = useState(""); // "Süreci bitmemiş" için kullanılan aşama slug
  const [accommodationPackage, setAccommodationPackage] = useState(""); // "" | "true" | "false"
  const [languageCourseCity, setLanguageCourseCity] = useState("");
  const [gmailStatus, setGmailStatus] = useState("");
  const [consultantId, setConsultantId] = useState(defaultConsultantId ?? "");
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [stages, setStages] = useState<{ slug: string; name: string }[]>([]);
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");
  const [draggingId, setDraggingId] = useState<string | null>(null);

  useEffect(() => {
    if (defaultConsultantId !== undefined) setConsultantId(defaultConsultantId ?? "");
  }, [defaultConsultantId]);

  function fetchStudents() {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
      ...(search && { search }),
      ...(stage && { stage }),
      ...(stageNot && { stageNot }),
      ...(gmailStatus && { gmailStatus }),
      ...(consultantId && isAdmin && { consultantId }),
      ...(accommodationPackage && { accommodationPackage }),
      ...(languageCourseCity.trim() && { languageCourseCity: languageCourseCity.trim() }),
    });
    fetch(`/api/students?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setStudents(data.students ?? []);
        setTotal(data.total ?? 0);
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchStudents();
  }, [page, pageSize, search, stage, stageNot, gmailStatus, consultantId, accommodationPackage, languageCourseCity]);

  useEffect(() => {
    if (isAdmin) {
      fetch("/api/users")
        .then((r) => r.json())
        .then((data: ConsultantsResponse) => setConsultants(data.consultants ?? []));
    }
  }, [isAdmin]);

  useEffect(() => {
    fetch("/api/stages")
      .then((r) => r.json())
      .then((data: { stages?: { slug: string; name: string }[] }) => setStages(data.stages ?? []))
      .catch(() => setStages([]));
  }, []);

  const totalPages = Math.ceil(total / pageSize);

  function statusBadge(status: string) {
    if (status === "connected")
      return (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
            Bağlı
          </span>
        </div>
      );
    if (status === "expired")
      return (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Süresi dolmuş
          </span>
        </div>
      );
    return (
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        <span className="text-sm font-medium text-rose-600 dark:text-rose-400">
          Bağlı değil
        </span>
      </div>
    );
  }

  async function updateStudentStage(studentId: string, newStage: string) {
    const target = students.find((s) => s.id === studentId);
    if (!target || target.stage === newStage) return;
    const prevStage = target.stage;
    setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, stage: newStage } : s)));
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
    });
    if (!res.ok) {
      setStudents((prev) => prev.map((s) => (s.id === studentId ? { ...s, stage: prevStage } : s)));
    }
  }

  function handleDropOnStage(stageSlug: string) {
    if (!draggingId) return;
    updateStudentStage(draggingId, stageSlug);
    setDraggingId(null);
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 sm:mb-4">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Toplam <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> öğrenci
          {(search || stage || stageNot || gmailStatus || consultantId || accommodationPackage || languageCourseCity.trim()) && (
            <span className="ml-1 sm:ml-2 text-slate-500">(filtrelenmiş)</span>
          )}
        </p>
      </div>
      <div className="panel-card p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-br from-white to-slate-50/80 dark:from-slate-900 dark:to-slate-900/95">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-4 sm:gap-5">
          <div className="w-full sm:flex-1 sm:min-w-[180px] relative">
            <span className="material-icons-outlined absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
              search
            </span>
            <input
              className="input-panel pl-10 sm:pl-11"
              placeholder="Ad, ID veya e-posta ile ara..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="grid grid-cols-2 sm:flex gap-3 sm:gap-5">
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Aşama</span>
              <select
                className="input-panel w-full min-w-0 py-2.5 sm:min-w-[140px]"
                value={stage}
                onChange={(e) => { setStage(e.target.value); setPage(1); }}
              >
                <option value="">Tümü</option>
                {stages.map((s) => (
                  <option key={s.slug} value={s.slug}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Gmail</span>
              <select
                className="input-panel w-full min-w-0 py-2.5 sm:min-w-[140px]"
                value={gmailStatus}
                onChange={(e) => { setGmailStatus(e.target.value); setPage(1); }}
              >
                <option value="">Tümü</option>
                <option value="connected">Bağlı</option>
                <option value="expired">Süresi dolmuş</option>
                <option value="disconnected">Bağlı değil</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Konaklama paketi</span>
              <select
                className="input-panel w-full min-w-0 py-2.5 sm:min-w-[120px]"
                value={accommodationPackage}
                onChange={(e) => { setAccommodationPackage(e.target.value); setPage(1); }}
              >
                <option value="">Tümü</option>
                <option value="true">Evet</option>
                <option value="false">Hayır</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Dil kursu şehri</span>
              <input
                type="text"
                className="input-panel w-full min-w-0 py-2.5 sm:min-w-[140px]"
                placeholder="İçerir..."
                value={languageCourseCity}
                onChange={(e) => { setLanguageCourseCity(e.target.value); setPage(1); }}
              />
            </div>
            <label className="flex flex-col gap-1.5 sm:flex-row sm:items-end cursor-pointer">
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider sm:order-2 sm:ml-2">Süreci bitmemiş</span>
              <input
                type="checkbox"
                checked={!!stageNot}
                onChange={(e) => {
                  const slug = stages.find((s) => s.name === "Süreci Biten")?.slug ?? "bitten";
                  setStageNot(e.target.checked ? slug : "");
                  setPage(1);
                }}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
            </label>
            {isAdmin && (
              <div className="flex flex-col gap-1.5 col-span-2 sm:col-span-1">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Danışman</span>
                <select
                  className="input-panel w-full min-w-0 py-2.5 sm:min-w-[160px]"
                  value={consultantId}
                  onChange={(e) => { setConsultantId(e.target.value); setPage(1); }}
                >
                  <option value="">Tüm danışmanlar</option>
                  {consultants.map((c) => (
                    <option key={c.id} value={c.id}>{c.name ?? c.email}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 sm:ml-auto">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Görünüm</span>
            <div className="inline-flex rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden text-xs">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                className={`px-3 py-1.5 flex items-center gap-1 ${
                  viewMode === "table"
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="material-icons-outlined text-sm">table_chart</span>
                Tablo
              </button>
              <button
                type="button"
                onClick={() => setViewMode("kanban")}
                className={`px-3 py-1.5 flex items-center gap-1 ${
                  viewMode === "kanban"
                    ? "bg-primary text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <span className="material-icons-outlined text-sm">view_kanban</span>
                Kanban
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="panel-card">
        {isAdmin && (
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b-2 border-slate-200 dark:border-slate-700 flex justify-end bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
            <button
              onClick={() => setShowAddModal(true)}
              className="btn-primary-panel w-full sm:w-auto touch-manipulation py-3 sm:py-2.5"
            >
              <span className="material-icons-outlined text-lg">add</span>
              Öğrenci ekle
            </button>
          </div>
        )}

        {viewMode === "table" ? (
          <>
            {/* Mobil: kart listesi */}
            <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-700">
              {loading ? (
                <div className="px-4 py-12 text-center text-slate-500 text-sm">Yükleniyor…</div>
              ) : students.length === 0 ? (
                <div className="px-4 py-12 text-center text-slate-500 text-sm">Öğrenci bulunamadı.</div>
              ) : (
                students.map((s) => {
                  const status = s.gmailConnection?.status ?? "disconnected";
                  const lastSync = s.gmailConnection?.lastSyncAt;
                  return (
                    <Link
                      key={s.id}
                      href={`/students/${s.id}`}
                      className="block p-4 active:bg-slate-50 dark:active:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-slate-900 dark:text-white truncate">{s.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">#{s.id.slice(-6)}</p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span className="badge-stage bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                              {stages.find((x) => x.slug === s.stage)?.name ?? s.stage}
                            </span>
                            {statusBadge(status)}
                          </div>
                          <p className="text-xs text-slate-500 mt-1.5 truncate">
                            {s.consultant?.name ?? "—"} · {lastSync ? new Date(lastSync).toLocaleDateString("tr-TR") : "Senkron yok"}
                          </p>
                        </div>
                        <div className="shrink-0 flex flex-col items-end gap-2">
                          <Link
                            href={`/students/${s.id}/inbox`}
                            onClick={(e) => e.stopPropagation()}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary inline-flex"
                            title="Gelen kutusu"
                          >
                            <span className="material-icons-outlined text-lg">inbox</span>
                          </Link>
                          {isAdmin && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                if (!confirm(`"${s.name}" öğrencisini silmek istediğinize emin misiniz?`)) return;
                                fetch(`/api/students/${s.id}`, { method: "DELETE" }).then((res) => res.ok && fetchStudents());
                              }}
                              className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 inline-flex"
                              title="Sil"
                            >
                              <span className="material-icons-outlined text-lg">delete</span>
                            </button>
                          )}
                          {status === "expired" ? (
                            <a
                              href={`/api/oauth/gmail/start?studentId=${s.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="btn-primary-panel text-xs py-2 px-3 touch-manipulation"
                            >
                              Yeniden bağlan
                            </a>
                          ) : (
                            <Link
                              href={`/students/${s.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 inline-flex"
                            >
                              <span className="material-icons-outlined text-lg">chevron_right</span>
                            </Link>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Masaüstü: tablo */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="table-header-row">
                    <th className="table-th">Öğrenci</th>
                    <th className="table-th">Aşama</th>
                    <th className="table-th">Gmail durumu</th>
                    <th className="table-th">Atanan danışman</th>
                    <th className="table-th">Son senkron</th>
                    <th className="table-th text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-slate-700/80">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="table-td text-center py-16 text-slate-500 bg-slate-50/30 dark:bg-slate-800/20">
                        Yükleniyor…
                      </td>
                    </tr>
                  ) : (
                    students.map((s) => {
                      const status = s.gmailConnection?.status ?? "disconnected";
                      const lastSync = s.gmailConnection?.lastSyncAt;
                      return (
                        <tr key={s.id} className="table-row-hover table-row-zebra">
                          <td className="table-td">
                            <Link
                              href={`/students/${s.id}`}
                              className="flex flex-col hover:text-primary transition-colors"
                            >
                              <span className="font-semibold text-slate-900 dark:text-white">{s.name}</span>
                              <span className="text-[11px] text-slate-400 mt-0.5">
                                #{s.id.slice(-6)}
                              </span>
                            </Link>
                          </td>
                          <td className="table-td">
                            <select
                              value={s.stage}
                              onChange={(e) => updateStudentStage(s.id, e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="min-w-[110px] py-1.5 pl-2.5 pr-8 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors"
                            >
                              {stages.map((x) => (
                                <option key={x.slug} value={x.slug}>
                                  {x.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="table-td">{statusBadge(status)}</td>
                          <td className="table-td">
                            {isAdmin ? (
                              <select
                                value={s.assignedConsultantId ?? ""}
                                onChange={async (e) => {
                                  const id = e.target.value || null;
                                  const consultant = id ? consultants.find((c) => c.id === id) : null;
                                  const prevId = s.assignedConsultantId;
                                  setStudents((prev) =>
                                    prev.map((st) =>
                                      st.id === s.id
                                        ? { ...st, assignedConsultantId: id || null, consultant: consultant ?? null }
                                        : st
                                    )
                                  );
                                  const res = await fetch(`/api/students/${s.id}`, {
                                    method: "PATCH",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ assignedConsultantId: id }),
                                  });
                                  if (!res.ok) {
                                    setStudents((prev) =>
                                      prev.map((st) =>
                                        st.id === s.id
                                          ? { ...st, assignedConsultantId: prevId, consultant: s.consultant }
                                          : st
                                      )
                                    );
                                  }
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="min-w-[120px] py-1.5 pl-2.5 pr-8 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer transition-colors"
                              >
                                <option value="">Atama yok</option>
                                {consultants.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.name ?? c.email}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-sm">
                                {s.consultant?.name ?? "—"}
                              </span>
                            )}
                          </td>
                          <td className="table-td">
                            {lastSync ? (
                              <span className="text-sm text-slate-600 dark:text-slate-300">
                                {new Date(lastSync).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-sm text-slate-400">
                                Hiç senkron yok
                              </span>
                            )}
                          </td>
                          <td className="table-td text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Link
                                href={`/students/${s.id}/inbox`}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors inline-flex"
                                title="Gelen kutusu"
                              >
                                <span className="material-icons-outlined text-lg">inbox</span>
                              </Link>
                              <Link
                                href={`/students/${s.id}`}
                                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-primary transition-colors inline-flex"
                                title="Profili aç"
                              >
                                <span className="material-icons-outlined text-lg">open_in_new</span>
                              </Link>
                              {status === "expired" && (
                                <a
                                  href={`/api/oauth/gmail/start?studentId=${s.id}`}
                                  className="btn-primary-panel text-xs py-2 px-3"
                                >
                                  Yeniden bağlan
                                </a>
                              )}
                              {isAdmin && (
                                <button
                                  type="button"
                                  onClick={async (ev) => {
                                    ev.preventDefault();
                                    if (!confirm(`"${s.name}" öğrencisini silmek istediğinize emin misiniz? Tüm verileri silinir.`)) return;
                                    const res = await fetch(`/api/students/${s.id}`, { method: "DELETE" });
                                    if (res.ok) fetchStudents();
                                    else alert("Silinemedi.");
                                  }}
                                  className="p-2 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-500 hover:text-red-600 inline-flex"
                                  title="Öğrenciyi sil"
                                >
                                  <span className="material-icons-outlined text-lg">delete</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-3 py-4 sm:px-4 sm:py-5 overflow-x-auto">
            {loading ? (
              <div className="py-10 text-center text-slate-500 text-sm">Yükleniyor…</div>
            ) : students.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-sm">Öğrenci bulunamadı.</div>
            ) : (
              <div className="flex items-start gap-4 min-w-max">
                {stages.map((st) => {
                  const columnStudents = students.filter((s) => s.stage === st.slug);
                  return (
                    <div
                      key={st.slug}
                      className="w-72 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-700 flex-shrink-0 flex flex-col max-h-[70vh]"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropOnStage(st.slug)}
                    >
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-primary" />
                          <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{st.name}</span>
                        </div>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {columnStudents.length}
                        </span>
                      </div>
                      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-2">
                        {columnStudents.map((s) => {
                          const status = s.gmailConnection?.status ?? "disconnected";
                          const lastSync = s.gmailConnection?.lastSyncAt;
                          return (
                            <div
                              key={s.id}
                              draggable
                              onDragStart={() => setDraggingId(s.id)}
                              onDragEnd={() => setDraggingId(null)}
                              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-3 shadow-sm cursor-grab active:cursor-grabbing"
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <Link
                                    href={`/students/${s.id}`}
                                    className="text-sm font-semibold text-slate-900 dark:text-white hover:text-primary line-clamp-2"
                                  >
                                    {s.name}
                                  </Link>
                                  <p className="text-[11px] text-slate-400 mt-0.5">#{s.id.slice(-6)}</p>
                                  <p className="text-[11px] text-slate-500 mt-1 truncate">
                                    {s.consultant?.name ?? "Danışman yok"}
                                  </p>
                                </div>
                                <Link
                                  href={`/students/${s.id}/inbox`}
                                  className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-colors shrink-0"
                                  title="Gelen kutusu"
                                >
                                  <span className="material-icons-outlined text-base">inbox</span>
                                </Link>
                              </div>
                              <div className="mt-2 flex items-center justify-between gap-2">
                                <span className="text-[11px] text-slate-500">
                                  {lastSync
                                    ? new Date(lastSync).toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit" })
                                    : "Senkron yok"}
                                </span>
                                <span className="text-[11px]">
                                  {status === "connected" && (
                                    <span className="inline-flex items-center gap-1 text-emerald-600">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                      Bağlı
                                    </span>
                                  )}
                                  {status === "expired" && (
                                    <span className="inline-flex items-center gap-1 text-amber-600">
                                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                      Süresi dolmuş
                                    </span>
                                  )}
                                  {status === "disconnected" && (
                                    <span className="inline-flex items-center gap-1 text-rose-600">
                                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                      Bağlı değil
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {columnStudents.length === 0 && (
                          <p className="text-[11px] text-slate-400 text-center py-4">Bu aşamada öğrenci yok</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        <div className="px-4 sm:px-6 py-4 sm:py-5 bg-gradient-to-r from-slate-50 to-slate-100/80 dark:from-slate-800/50 dark:to-slate-800/30 border-t-2 border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
          <span className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 order-2 sm:order-1">
            <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * pageSize + 1}–{Math.min(page * pageSize, total)}</span>
            <span className="mx-1">/</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span>
            <span className="ml-1">öğrenci</span>
          </span>
          <div className="flex items-center gap-1 order-1 sm:order-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-3 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors touch-manipulation"
            >
              <span className="material-icons-outlined text-lg">chevron_left</span>
            </button>
            <span className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 px-2 sm:px-3">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-3 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-40 transition-colors touch-manipulation"
            >
              <span className="material-icons-outlined text-lg">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Add Student Modal - simple inline form for MVP */}
      {showAddModal && (
        <AddStudentModal
          consultants={consultants}
          stages={stages}
          onClose={() => setShowAddModal(false)}
          onSaved={() => {
            setShowAddModal(false);
            fetchStudents();
          }}
        />
      )}

      <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="panel-card p-4 sm:p-6 flex gap-3 sm:gap-4 border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-50/50 to-white dark:from-emerald-950/20 dark:to-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white">Bağlı</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Gmail OAuth aktif. Mailler senkron edilip gönderilebilir.
            </p>
          </div>
        </div>
        <div className="panel-card p-4 sm:p-6 flex gap-3 sm:gap-4 border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-white dark:from-amber-950/20 dark:to-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white">Süresi dolmuş</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Öğrencinin tekrar yetkilendirmesi gerekiyor (Yeniden bağlan).
            </p>
          </div>
        </div>
        <div className="panel-card p-4 sm:p-6 flex gap-3 sm:gap-4 border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-50/50 to-white dark:from-rose-950/20 dark:to-slate-900">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/20 flex items-center justify-center shrink-0">
            <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-slate-900 dark:text-white">Bağlı değil</p>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              Gmail bağlantısı yok. Öğrenci detay sayfasından bağlayın.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

function AddStudentModal({
  consultants,
  stages,
  onClose,
  onSaved,
}: {
  consultants: { id: string; name: string | null; email: string | null }[];
  stages: { slug: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [loginEmail, setLoginEmail] = useState("");
  const [password, setPassword] = useState("");
  const defaultStage = stages[0]?.slug ?? "lead";
  const [stage, setStage] = useState(defaultStage);
  const [assignedConsultantId, setAssignedConsultantId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const res = await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        studentEmail: studentEmail || undefined,
        loginEmail: loginEmail || undefined,
        password: password || undefined,
        stage,
        assignedConsultantId: assignedConsultantId || undefined,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      setError(data.error ?? "Öğrenci oluşturulamadı");
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="panel-card-inner w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-5">Öğrenci ekle</h2>
        <form onSubmit={submit} className="space-y-5">
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Ad *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-panel"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              E-posta (iletişim, isteğe bağlı)
            </label>
            <input
              type="email"
              value={studentEmail}
              onChange={(e) => setStudentEmail(e.target.value)}
              className="input-panel"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Giriş e-postası (portal şifresi belirlemek için)
            </label>
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="input-panel"
              placeholder="Şifre verilecekse gerekli"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Portal şifresi (isteğe bağlı)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-panel"
              placeholder="En az 8 karakter"
              minLength={8}
            />
            <p className="text-xs text-slate-500 mt-1">Belirlenirse öğrenci bu e-posta ve şifre ile giriş yapabilir.</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Aşama
            </label>
            <select
              value={stages.some((s) => s.slug === stage) ? stage : defaultStage}
              onChange={(e) => setStage(e.target.value)}
              className="input-panel"
            >
              {(stages.length ? stages : [{ slug: "lead", name: "Lead" }]).map((s) => (
                <option key={s.slug} value={s.slug}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Danışman ata
            </label>
            <select
              value={assignedConsultantId}
              onChange={(e) => setAssignedConsultantId(e.target.value)}
              className="input-panel"
            >
              <option value="">—</option>
              {consultants.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name ?? c.email}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary-panel flex-1">
              İptal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary-panel flex-1 disabled:opacity-50"
            >
              {saving ? "Kaydediliyor…" : "Öğrenci ekle"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
