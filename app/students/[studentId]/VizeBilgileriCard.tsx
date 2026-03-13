"use client";

import { useState, useEffect } from "react";

type VisaInfo = {
  visaInstitution: string | null;
  visaCity: string | null;
  visaProgramStartDate: string | null;
  visaNotes: string | null;
  visaConsulate: string | null;
  visaApplicationDate: string | null;
  visaAppointmentDate: string | null;
  visaStartDate: string | null;
  visaEndDate: string | null;
  visaDocumentPath: string | null;
};

export function VizeBilgileriCard({ studentId }: { studentId: string }) {
  const [info, setInfo] = useState<VisaInfo>({
    visaInstitution: null,
    visaCity: null,
    visaProgramStartDate: null,
    visaNotes: null,
    visaConsulate: null,
    visaApplicationDate: null,
    visaAppointmentDate: null,
    visaStartDate: null,
    visaEndDate: null,
    visaDocumentPath: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/students/${studentId}/vize`)
      .then((r) => r.json())
      .then((d) => {
        setInfo({
          visaInstitution: d.visaInstitution ?? "",
          visaCity: d.visaCity ?? "",
          visaProgramStartDate: d.visaProgramStartDate?.slice(0, 10) ?? "",
          visaNotes: d.visaNotes ?? "",
          visaConsulate: d.visaConsulate ?? "",
          visaApplicationDate: d.visaApplicationDate?.slice(0, 10) ?? "",
          visaAppointmentDate: d.visaAppointmentDate?.slice(0, 10) ?? "",
          visaStartDate: d.visaStartDate?.slice(0, 10) ?? "",
          visaEndDate: d.visaEndDate?.slice(0, 10) ?? "",
          visaDocumentPath: d.visaDocumentPath ?? null,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [studentId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/vize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visaInstitution: info.visaInstitution || null,
        visaCity: info.visaCity || null,
        visaProgramStartDate: info.visaProgramStartDate || null,
        visaNotes: info.visaNotes || null,
        visaConsulate: info.visaConsulate || null,
        visaApplicationDate: info.visaApplicationDate || null,
        visaAppointmentDate: info.visaAppointmentDate || null,
        visaStartDate: info.visaStartDate || null,
        visaEndDate: info.visaEndDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) load();
  }

  if (loading) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6 sm:mb-8">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Vize bilgileri</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Öğrenci vize sayfasında bu bilgiler görünür.</p>
      </div>
      <form onSubmit={save} className="p-4 sm:p-6 space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kayıt olunan kurum</label>
          <input
            type="text"
            value={info.visaInstitution ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaInstitution: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            placeholder="Kurum adı"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Şehir</label>
          <input
            type="text"
            value={info.visaCity ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaCity: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            placeholder="Şehir"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Program başlangıç tarihi</label>
          <input
            type="date"
            value={info.visaProgramStartDate ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaProgramStartDate: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Bilgi (teklifin kabulü vb.)</label>
          <textarea
            value={info.visaNotes ?? ""}
            onChange={(e) => setInfo((p) => ({ ...p, visaNotes: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3 min-h-[80px]"
            placeholder="Ek bilgi"
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Başvurulan konsolosluk</label>
            <input
              type="text"
              value={info.visaConsulate ?? ""}
              onChange={(e) => setInfo((p) => ({ ...p, visaConsulate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
              placeholder="Örn. Almanya İstanbul Başkonsolosluğu"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize başvuru tarihi</label>
            <input
              type="date"
              value={info.visaApplicationDate ?? ""}
              onChange={(e) => setInfo((p) => ({ ...p, visaApplicationDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Randevu tarihi</label>
            <input
              type="date"
              value={info.visaAppointmentDate ?? ""}
              onChange={(e) => setInfo((p) => ({ ...p, visaAppointmentDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize başlangıç tarihi</label>
            <input
              type="date"
              value={info.visaStartDate ?? ""}
              onChange={(e) => setInfo((p) => ({ ...p, visaStartDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize bitiş tarihi</label>
            <input
              type="date"
              value={info.visaEndDate ?? ""}
              onChange={(e) => setInfo((p) => ({ ...p, visaEndDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            />
          </div>
        </div>
        {info.visaDocumentPath && (
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize belgesi</label>
            <a
              href={`/api/students/${studentId}/vize/doc`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              <span className="material-icons-outlined text-lg">download</span>
              İndir
            </a>
          </div>
        )}
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70"
        >
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </section>
  );
}
