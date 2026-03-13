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

export function VizeBilgileriClient({ studentId }: { studentId: string }) {
  const [info, setInfo] = useState<VisaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [form, setForm] = useState<{ visaStartDate: string; visaEndDate: string }>({
    visaStartDate: "",
    visaEndDate: "",
  });

  useEffect(() => {
    fetch(`/api/students/${studentId}/vize`)
      .then((r) => r.json())
      .then((d) => {
        setInfo({
          visaInstitution: d.visaInstitution ?? null,
          visaCity: d.visaCity ?? null,
          visaProgramStartDate: d.visaProgramStartDate ?? null,
          visaNotes: d.visaNotes ?? null,
          visaConsulate: d.visaConsulate ?? null,
          visaApplicationDate: d.visaApplicationDate ?? null,
          visaAppointmentDate: d.visaAppointmentDate ?? null,
          visaStartDate: d.visaStartDate ?? null,
          visaEndDate: d.visaEndDate ?? null,
          visaDocumentPath: d.visaDocumentPath ?? null,
        });
        setForm({
          visaStartDate: d.visaStartDate ?? "",
          visaEndDate: d.visaEndDate ?? "",
        });
      })
      .finally(() => setLoading(false));
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  const hasAny =
    info?.visaInstitution ||
    info?.visaCity ||
    info?.visaProgramStartDate ||
    info?.visaNotes ||
    info?.visaConsulate ||
    info?.visaApplicationDate ||
    info?.visaAppointmentDate ||
    info?.visaStartDate ||
    info?.visaEndDate ||
    info?.visaDocumentPath;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/vize`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visaStartDate: form.visaStartDate || null,
        visaEndDate: form.visaEndDate || null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      const d = await res.json().catch(() => null);
      // Backend sadece { ok: true } dönüyor; bu yüzden yerel state'i güncelliyoruz
      setInfo((prev) =>
        prev
          ? {
              ...prev,
              visaStartDate: form.visaStartDate || null,
              visaEndDate: form.visaEndDate || null,
            }
          : prev,
      );
      setEditing(false);
    }
  }

  async function handleVizeDocUpload(file: File) {
    if (!file?.size) return;
    setUploadingDoc(true);
    const form = new FormData();
    form.set("file", file);
    const res = await fetch(`/api/students/${studentId}/vize/upload`, { method: "POST", body: form });
    setUploadingDoc(false);
    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      if (data.filePath) setInfo((prev) => prev ? { ...prev, visaDocumentPath: data.filePath } : prev);
    } else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Yükleme başarısız.");
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      {!hasAny ? (
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-sm">
            <span className="material-icons-outlined text-2xl">info</span>
            <span>Bu bölüm danışmanınız vize sürecinizi başlattığında doldurulacaktır.</span>
          </div>
        </div>
      ) : (
        <div className="p-6 sm:p-8 space-y-6">
          <div className="space-y-4">
            {info?.visaInstitution && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Kayıt olunan kurum</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">{info.visaInstitution}</dd>
              </div>
            )}
            {info?.visaCity && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Şehir</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">{info.visaCity}</dd>
              </div>
            )}
            {info?.visaProgramStartDate && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Program başlangıç tarihi</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {new Date(info.visaProgramStartDate).toLocaleDateString("tr-TR")}
                </dd>
              </div>
            )}
            {info?.visaConsulate && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Başvurulan konsolosluk</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">{info.visaConsulate}</dd>
              </div>
            )}
            {info?.visaApplicationDate && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Vize başvuru tarihi</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {new Date(info.visaApplicationDate).toLocaleDateString("tr-TR")}
                </dd>
              </div>
            )}
            {info?.visaAppointmentDate && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Randevu tarihi</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200">
                  {new Date(info.visaAppointmentDate).toLocaleDateString("tr-TR")}
                </dd>
              </div>
            )}
            {info?.visaNotes && (
              <div>
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Bilgi</dt>
                <dd className="mt-1 text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{info.visaNotes}</dd>
              </div>
            )}
          </div>

          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Vizem Geldi</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Vizeniz onaylandığında başlangıç ve bitiş tarihlerini buradan girebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="px-3 py-1.5 rounded-lg border border-primary/30 text-primary text-xs font-medium hover:bg-primary/5"
              >
                {editing ? "İptal" : "Vizem Geldi"}
              </button>
            </div>

            {editing && (
              <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize başlangıç tarihi</label>
                  <input
                    type="date"
                    value={form.visaStartDate}
                    onChange={(e) => setForm((p) => ({ ...p, visaStartDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize bitiş tarihi</label>
                  <input
                    type="date"
                    value={form.visaEndDate}
                    onChange={(e) => setForm((p) => ({ ...p, visaEndDate: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70 w-full"
                  >
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                </div>
              </form>
            )}
            <div className="mt-3">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Vize belgesi</p>
              {info?.visaDocumentPath ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/students/${studentId}/vize/doc`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    <span className="material-icons-outlined text-lg">download</span>
                    İndir
                  </a>
                  <span className="text-slate-400">|</span>
                  <label className="text-sm text-primary hover:underline cursor-pointer flex items-center gap-1">
                    <span className="material-icons-outlined text-lg">upload</span>
                    {uploadingDoc ? "Yükleniyor…" : "Yenile"}
                    <input
                      type="file"
                      className="sr-only"
                      accept=".pdf,image/jpeg,image/png,image/webp"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleVizeDocUpload(f);
                        e.target.value = "";
                      }}
                      disabled={uploadingDoc}
                    />
                  </label>
                </div>
              ) : (
                <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700">
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleVizeDocUpload(f);
                      e.target.value = "";
                    }}
                    disabled={uploadingDoc}
                  />
                  <span className="material-icons-outlined text-lg">upload_file</span>
                  {uploadingDoc ? "Yükleniyor…" : "Vize belgesi yükle"}
                </label>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
