"use client";

import { useState, useEffect, useCallback } from "react";
import { COUNTRY_OPTIONS } from "@/lib/countries";

type Field = {
  id: string;
  slug: string;
  label: string;
  type: string;
  required?: boolean;
  options?: { value: string; label: string }[] | null;
  allowMultiple?: boolean;
};

type Section = { id: string; slug: string; name: string; sortOrder: number; fields: Field[] };
type ValueItem = { fieldSlug: string; value: string };
type DocItem = { id: string; fieldSlug: string; fieldLabel: string; fileName: string; fileSize: number | null; uploadedAt: string; version?: number; status?: string };

export function CrmCardClient({ studentId, editable = false }: { studentId: string; editable?: boolean }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [values, setValues] = useState<ValueItem[]>([]);
  const [documents, setDocuments] = useState<DocItem[]>([]);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    const [formRes, dataRes] = await Promise.all([
      fetch("/api/crm/form"),
      fetch(`/api/students/${studentId}/crm`),
    ]);
    if (formRes.ok) {
      const j = await formRes.json();
      setSections(j.sections ?? []);
      if ((j.sections ?? []).length > 0 && !openSection) setOpenSection(j.sections[0].id);
    }
    if (dataRes.ok) {
      const j = await dataRes.json();
      setValues(j.values ?? []);
      setDocuments(j.documents ?? []);
      const valMap: Record<string, string> = {};
      (j.values ?? []).forEach((v: ValueItem) => { valMap[v.fieldSlug] = v.value; });
      setEditValues(valMap);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const valueBySlug = Object.fromEntries(values.map((v) => [v.fieldSlug, v.value]));
  const isSectionEditing = (secId: string) => editable && editingSectionId === secId;
  const docsBySlug = documents.reduce((acc, d) => {
    if (!acc[d.fieldSlug]) acc[d.fieldSlug] = [];
    acc[d.fieldSlug].push(d);
    return acc;
  }, {} as Record<string, DocItem[]>);

  async function saveSection(section: Section) {
    const slugs = section.fields.filter((f) => f.type !== "FILE").map((f) => f.slug);
    const payload = slugs.filter((s) => editValues[s] !== undefined).map((s) => ({ fieldSlug: s, value: editValues[s] ?? "" }));
    if (payload.length === 0) return;
    const res = await fetch(`/api/students/${studentId}/crm/values`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values: payload }),
    });
    if (!res.ok) throw new Error("Kaydetme başarısız");
  }

  async function handleSaveSection(section: Section) {
    setSaving(true);
    setError("");
    try {
      await saveSection(section);
      const valMap: Record<string, string> = {};
      section.fields.filter((f) => f.type !== "FILE").forEach((f) => {
        if (editValues[f.slug] !== undefined) valMap[f.slug] = editValues[f.slug];
      });
      setValues((prev) => prev.filter((v) => !(v.fieldSlug in valMap)).concat(Object.entries(valMap).map(([fieldSlug, value]) => ({ fieldSlug, value }))));
      setEditingSectionId(null);
    } catch {
      setError("Kaydedilirken hata oluştu.");
    }
    setSaving(false);
  }

  function startEditingSection(sec: Section) {
    const patch: Record<string, string> = {};
    sec.fields.forEach((f) => {
      if (f.type !== "FILE" && valueBySlug[f.slug] !== undefined) patch[f.slug] = valueBySlug[f.slug];
    });
    setEditValues((prev) => ({ ...prev, ...patch }));
    setEditingSectionId(sec.id);
  }

  function cancelEditingSection(sec: Section) {
    const patch: Record<string, string> = {};
    sec.fields.forEach((f) => {
      if (f.type !== "FILE" && valueBySlug[f.slug] !== undefined) patch[f.slug] = valueBySlug[f.slug];
    });
    setEditValues((prev) => ({ ...prev, ...patch }));
    setEditingSectionId(null);
  }

  async function uploadFile(fieldSlug: string, file: File) {
    const form = new FormData();
    form.append("fieldSlug", fieldSlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/crm/documents`, { method: "POST", body: form });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "Yükleme başarısız");
    }
    const doc = await res.json();
    setDocuments((prev) => [...prev, { id: doc.id, fieldSlug, fieldLabel: "", fileName: doc.fileName, fileSize: null, uploadedAt: doc.uploadedAt, version: doc.version, status: doc.status }]);
  }

  function getOptions(field: Field) {
    if (field.slug === "country" && (!field.options || field.options.length === 0)) return COUNTRY_OPTIONS;
    return field.options ?? [];
  }

  if (loading) {
    return (
      <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 mb-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-500">
          <span className="material-icons-outlined animate-spin">progress_activity</span>
          <span className="text-sm">CRM kartı yükleniyor...</span>
        </div>
      </section>
    );
  }

  if (sections.length === 0) return null;

  return (
    <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 mb-6 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-icons-outlined text-primary text-2xl">badge</span>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">CRM Kartı</h2>
        </div>
        {editable && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-lg">
            Düzenlenebilir
          </span>
        )}
      </div>

      {error && (
        <div className="mx-5 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm flex items-center gap-2">
          <span className="material-icons-outlined">error_outline</span>
          {error}
        </div>
      )}

      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {sections
          .filter((sec) => sec.slug !== "documents")
          .map((sec) => {
          const isOpen = openSection === sec.id;
          return (
            <div key={sec.id}>
              <button
                type="button"
                onClick={() => setOpenSection(isOpen ? null : sec.id)}
                className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <span className="font-semibold text-slate-800 dark:text-slate-100">{sec.name}</span>
                <span className="material-icons-outlined text-slate-400">
                  {isOpen ? "expand_less" : "expand_more"}
                </span>
              </button>
              {isOpen && (
                <div className="px-5 pb-5 pt-1 bg-slate-50/50 dark:bg-slate-800/30 max-h-[60vh] overflow-y-auto">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
                    {sec.fields.map((field) => {
                      if (field.type === "FILE") {
                        return null;
                      }

                      if (isSectionEditing(sec.id)) {
                        return (
                          <div key={field.id} className={field.type === "TEXTAREA" ? "sm:col-span-2" : ""}>
                            <dt className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1.5">{field.label}</dt>
                            <dd>
                              {field.type === "TEXT" && (
                                <input
                                  type="text"
                                  value={editValues[field.slug] ?? ""}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                                  className="input-panel w-full"
                                />
                              )}
                              {field.type === "EMAIL" && (
                                <input
                                  type="email"
                                  value={editValues[field.slug] ?? ""}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                                  className="input-panel w-full"
                                />
                              )}
                              {field.type === "TEL" && (
                                <input
                                  type="tel"
                                  value={editValues[field.slug] ?? ""}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                                  className="input-panel w-full"
                                />
                              )}
                              {field.type === "DATE" && (
                                <input
                                  type="date"
                                  value={editValues[field.slug] ?? ""}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                                  className="input-panel w-full"
                                />
                              )}
                              {field.type === "TEXTAREA" && (
                                <textarea
                                  value={editValues[field.slug] ?? ""}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                                  className="input-panel w-full min-h-[80px]"
                                  rows={3}
                                />
                              )}
                              {field.type === "CHECKBOX" && (
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={(editValues[field.slug] ?? "") === "true"}
                                    onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.checked ? "true" : "false" }))}
                                    className="rounded border-slate-300 text-primary focus:ring-primary"
                                  />
                                  <span className="text-sm text-slate-600 dark:text-slate-400">Evet</span>
                                </label>
                              )}
                              {field.type === "RADIO" && (
                                <div className="flex flex-wrap gap-4">
                                  {(field.options ?? []).map((opt) => (
                                    <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={field.slug}
                                        value={opt.value}
                                        checked={(editValues[field.slug] ?? "") === opt.value}
                                        onChange={() => setEditValues((v) => ({ ...v, [field.slug]: opt.value }))}
                                        className="text-primary focus:ring-primary"
                                      />
                                      <span className="text-sm text-slate-700 dark:text-slate-300">{opt.label}</span>
                                    </label>
                                  ))}
                                </div>
                              )}
                              {field.type === "SELECT" && (
                                <select
                                  value={editValues[field.slug] ?? ""}
                                  onChange={(e) => setEditValues((v) => ({ ...v, [field.slug]: e.target.value }))}
                                  className="input-panel w-full"
                                >
                                  <option value="">Seçiniz</option>
                                  {getOptions(field).map((opt) => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                  ))}
                                </select>
                              )}
                            </dd>
                          </div>
                        );
                      }

                      const val = (valueBySlug[field.slug] ?? "").trim();
                      return (
                        <div key={field.id}>
                          <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-0.5">{field.label}</dt>
                          <dd className="text-sm text-slate-900 dark:text-white break-words">
                            {val || "—"}
                          </dd>
                        </div>
                      );
                    })}
                  </dl>
                  {editable && (
                    <div className="mt-4 flex items-center justify-end gap-2">
                      {isSectionEditing(sec.id) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => cancelEditingSection(sec)}
                            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            İptal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveSection(sec)}
                            disabled={saving}
                            className="btn-primary-panel text-sm py-2.5 px-5"
                          >
                            {saving ? "Kaydediliyor..." : "Kaydet"}
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditingSection(sec)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-primary/30 text-primary text-sm font-medium hover:bg-primary/10 dark:hover:bg-primary/20"
                        >
                          <span className="material-icons-outlined text-lg">edit</span>
                          Düzenle
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
