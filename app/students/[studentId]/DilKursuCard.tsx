"use client";

import { useState, useEffect } from "react";

type Postponement = { from: string; to: string };
type Institution = {
  id: string;
  type: string;
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

export function DilKursuCard({ studentId }: { studentId: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [form, setForm] = useState({
    languageCourseName: "",
    languageCourseStartDate: "",
    languageCourseInstitutionId: "",
    languageCoursePostponements: [] as Postponement[],
  });

  const load = () => {
    Promise.all([
      fetch(`/api/students/${studentId}/dil-kursu`).then((r) => r.json()),
      fetch("/api/institutions").then((r) => r.json()),
    ])
      .then(([dilData, instData]) => {
        const instList = (instData.institutions ?? []).filter((i: Institution) => i.type === "LANGUAGE_COURSE");
        setInstitutions(instList);
        const post = Array.isArray(dilData.languageCoursePostponements) ? dilData.languageCoursePostponements : [];
        setData({
          languageCourseName: dilData.languageCourseName ?? null,
          languageCourseStartDate: dilData.languageCourseStartDate ?? null,
          languageCourseInstitutionId: dilData.languageCourseInstitutionId ?? null,
          languageCourseInstitution: dilData.languageCourseInstitution ?? null,
          languageCourseRegistrationDocPath: dilData.languageCourseRegistrationDocPath ?? null,
          languageCourseInvoicePath: dilData.languageCourseInvoicePath ?? null,
          languageCourseReceiptPath: dilData.languageCourseReceiptPath ?? null,
          languageCoursePostponements: post,
        });
        setForm({
          languageCourseName: dilData.languageCourseName ?? "",
          languageCourseStartDate: dilData.languageCourseStartDate?.slice(0, 10) ?? "",
          languageCourseInstitutionId: dilData.languageCourseInstitutionId ?? "",
          languageCoursePostponements: post,
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [studentId]);

  async function saveStudent(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        languageCourseName: form.languageCourseName || null,
        languageCourseStartDate: form.languageCourseStartDate || null,
        languageCourseInstitutionId: form.languageCourseInstitutionId || null,
        languageCoursePostponements: form.languageCoursePostponements.length ? form.languageCoursePostponements : null,
      }),
    });
    setSaving(false);
    if (res.ok) load();
  }

  async function handleFileUpload(field: "registrationDoc" | "invoice", file: File) {
    if (!file?.size) return;
    setUploading(field);
    const formData = new FormData();
    formData.set("field", field);
    formData.set("file", file);
    const res = await fetch(`/api/students/${studentId}/dil-kursu/upload`, { method: "POST", body: formData });
    setUploading(null);
    if (res.ok) load();
    else {
      const err = await res.json().catch(() => ({}));
      alert(err.error || "Yükleme başarısız.");
    }
  }

  function addPostponement() {
    setForm((p) => ({
      ...p,
      languageCoursePostponements: [...p.languageCoursePostponements, { from: "", to: "" }],
    }));
  }
  function removePostponement(i: number) {
    setForm((p) => ({
      ...p,
      languageCoursePostponements: p.languageCoursePostponements.filter((_, idx) => idx !== i),
    }));
  }
  function updatePostponement(i: number, key: "from" | "to", value: string) {
    setForm((p) => ({
      ...p,
      languageCoursePostponements: p.languageCoursePostponements.map((item, idx) =>
        idx === i ? { ...item, [key]: value } : item
      ),
    }));
  }

  if (loading) return null;

  const inst = data?.languageCourseInstitution;
  const hasDoc = (path: string | null | undefined) => path != null && path.length > 0;
  const docUrl = (field: string) => `/api/students/${studentId}/dil-kursu/doc?field=${field}`;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Dil kursu</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Kurs bilgileri, belgeler ve ertelemeler.</p>
      </div>
      <form onSubmit={saveStudent} className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dil kursu adı</label>
            <input
              type="text"
              value={form.languageCourseName}
              onChange={(e) => setForm((p) => ({ ...p, languageCourseName: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
              placeholder="Kurum adı"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Dil kursu başlangıç tarihi</label>
            <input
              type="date"
              value={form.languageCourseStartDate}
              onChange={(e) => setForm((p) => ({ ...p, languageCourseStartDate: e.target.value }))}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Kayıtlı dil kursu (kurum)</label>
          <select
            value={form.languageCourseInstitutionId}
            onChange={(e) => setForm((p) => ({ ...p, languageCourseInstitutionId: e.target.value }))}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-3"
          >
            <option value="">Seçin</option>
            {institutions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}{i.isPartner ? " (Partner)" : ""}</option>
            ))}
          </select>
        </div>

        {inst && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <span className="material-icons-outlined text-lg">school</span>
              Kurum kartı
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
              {inst.catalogPdfPath && (
                <a
                  href={`/api/admin/institutions/${inst.id}/catalog`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-icons-outlined text-sm">picture_as_pdf</span>
                  Katalog
                </a>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-3">Belgeler</h3>
          <div className="space-y-3">
            {(["registrationDoc", "invoice", "receipt"] as const).map((field) => {
              const path = field === "registrationDoc" ? data?.languageCourseRegistrationDocPath : field === "invoice" ? data?.languageCourseInvoicePath : data?.languageCourseReceiptPath;
              const canUpload = field !== "receipt";
              return (
                <div key={field} className="flex items-center justify-between gap-4 py-2">
                  <span className="text-sm text-slate-600 dark:text-slate-400">{DOC_LABELS[field]}</span>
                  <div className="flex items-center gap-2">
                    {hasDoc(path) ? (
                      <a href={docUrl(field)} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
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
                            if (f) handleFileUpload(field, f);
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
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Ertelemeler</h3>
            <button type="button" onClick={addPostponement} className="text-xs text-primary hover:underline flex items-center gap-1">
              <span className="material-icons-outlined text-sm">add</span>
              Ekle
            </button>
          </div>
          {form.languageCoursePostponements.length === 0 ? (
            <p className="text-xs text-slate-500">Henüz erteleme yok.</p>
          ) : (
            <ul className="space-y-2">
              {form.languageCoursePostponements.map((p, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <input
                    type="date"
                    value={p.from}
                    onChange={(e) => updatePostponement(i, "from", e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1.5 px-2"
                  />
                  <span className="text-slate-500">→</span>
                  <input
                    type="date"
                    value={p.to}
                    onChange={(e) => updatePostponement(i, "to", e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs py-1.5 px-2"
                  />
                  <button type="button" onClick={() => removePostponement(i)} className="p-1 text-slate-400 hover:text-red-600" title="Kaldır">
                    <span className="material-icons-outlined text-sm">close</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button type="submit" disabled={saving} className="px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-70">
          {saving ? "Kaydediliyor..." : "Kaydet"}
        </button>
      </form>
    </section>
  );
}
