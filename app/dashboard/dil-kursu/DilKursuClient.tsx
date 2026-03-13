"use client";

import { useState, useEffect } from "react";

type Postponement = { from: string; to: string };
type Institution = {
  id: string;
  name: string;
  address: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  isPartner: boolean;
  catalogPdfPath: string | null;
};
type Data = {
  languageCourseName: string | null;
  languageCourseStartDate: string | null;
  languageCourseInstitutionId: string | null;
  languageCourseInstitution: Institution | null;
  languageCourseRegistrationDocPath: string | null;
  languageCourseInvoicePath: string | null;
  languageCourseReceiptPath: string | null;
  languageCoursePostponements: Postponement[] | null;
};

const DOC_LABELS: Record<string, string> = {
  registrationDoc: "Kayıt belgesi",
  invoice: "Dil kursu faturası",
  receipt: "Dil kursu dekontu",
};

export function DilKursuClient({ studentId }: { studentId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/students/${studentId}/dil-kursu`)
      .then((r) => r.json())
      .then((d) => {
        setData({
          languageCourseName: d.languageCourseName ?? null,
          languageCourseStartDate: d.languageCourseStartDate ?? null,
          languageCourseInstitutionId: d.languageCourseInstitutionId ?? null,
          languageCourseInstitution: d.languageCourseInstitution ?? null,
          languageCourseRegistrationDocPath: d.languageCourseRegistrationDocPath ?? null,
          languageCourseInvoicePath: d.languageCourseInvoicePath ?? null,
          languageCourseReceiptPath: d.languageCourseReceiptPath ?? null,
          languageCoursePostponements: Array.isArray(d.languageCoursePostponements) ? d.languageCoursePostponements : null,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [studentId]);

  async function handleFileUpload(field: "receipt", file: File) {
    if (!file?.size) return;
    setUploading(field);
    const form = new FormData();
    form.set("field", field);
    form.set("file", file);
    const res = await fetch(`/api/students/${studentId}/dil-kursu/upload`, { method: "POST", body: form });
    setUploading(null);
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Yükleme başarısız.");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  const inst = data?.languageCourseInstitution;
  const hasDoc = (path: string | null | undefined) => path != null && path.length > 0;
  const docUrl = (field: string) => `/api/students/${studentId}/dil-kursu/doc?field=${field}`;

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden space-y-6">
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dil kursu adı</dt>
            <dd className="mt-1 text-slate-800 dark:text-slate-200">{data?.languageCourseName || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dil kursu başlangıç tarihi</dt>
            <dd className="mt-1 text-slate-800 dark:text-slate-200">
              {data?.languageCourseStartDate ? new Date(data.languageCourseStartDate).toLocaleDateString("tr-TR") : "—"}
            </dd>
          </div>
        </div>

        {inst && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="material-icons-outlined text-lg">school</span>
              Dil kursu kartı
              {inst.isPartner && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">Partner</span>
              )}
            </h3>
            <p className="mt-1 text-slate-700 dark:text-slate-300">{inst.name}</p>
            {inst.address && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{inst.address}</p>}
            <div className="mt-2 flex flex-wrap gap-3">
              {inst.contactEmail && (
                <a href={`mailto:${inst.contactEmail}`} className="text-xs text-primary hover:underline flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">email</span>
                  {inst.contactEmail}
                </a>
              )}
              {inst.contactPhone && (
                <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <span className="material-icons-outlined text-sm">phone</span>
                  {inst.contactPhone}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Belgeler</h3>
          <div className="space-y-3">
            {(["registrationDoc", "invoice", "receipt"] as const).map((field) => {
              const path = field === "registrationDoc" ? data?.languageCourseRegistrationDocPath : field === "invoice" ? data?.languageCourseInvoicePath : data?.languageCourseReceiptPath;
              const canUpload = field === "receipt";
              return (
                <div key={field} className="flex items-center justify-between gap-4 py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{DOC_LABELS[field]}</span>
                  <div className="flex items-center gap-2">
                    {hasDoc(path) ? (
                      <a
                        href={docUrl(field)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <span className="material-icons-outlined text-sm">download</span>
                        İndir
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Yok</span>
                    )}
                    {canUpload && (
                      <label className="text-xs font-medium text-primary cursor-pointer flex items-center gap-1">
                        <span className="material-icons-outlined text-sm">upload</span>
                        {uploading === field ? "Yükleniyor..." : "Yükle"}
                        <input
                          type="file"
                          className="sr-only"
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleFileUpload("receipt", f);
                            e.target.value = "";
                          }}
                          disabled={!!uploading}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Kayıt belgesi ve fatura operasyon tarafından yüklenir. Dekontu siz yüklersiniz.
          </p>
        </div>

        {data?.languageCoursePostponements && data.languageCoursePostponements.length > 0 && (
          <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">Ertelemeler</h3>
            <ul className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
              {data.languageCoursePostponements.map((p, i) => (
                <li key={i}>
                  {new Date(p.from).toLocaleDateString("tr-TR")} → {new Date(p.to).toLocaleDateString("tr-TR")}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
