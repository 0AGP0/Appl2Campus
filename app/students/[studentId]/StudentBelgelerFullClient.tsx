"use client";

import { useState, useEffect, useCallback } from "react";
import { getDocumentStatusLabel, getDocumentStatusBadgeClass } from "@/lib/document-status";

type Field = { id: string; slug: string; label: string; type: string; allowMultiple: boolean };
type Section = { id: string; slug: string; name: string; fields: Field[] };
type CrmDoc = { id: string; fieldSlug: string; fileName: string; uploadedAt: string; version?: number; status?: string };
type Category = { id: string; slug: string; name: string; type: string };
type DocByCat = { id: string; categorySlug: string; categoryName: string; categoryType: string; fileName: string; version: number; status: string; uploadedAt: string };

export function StudentBelgelerFullClient({ studentId }: { studentId: string }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [crmDocuments, setCrmDocuments] = useState<CrmDoc[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [documentsByCat, setDocumentsByCat] = useState<DocByCat[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedOpSlug, setSelectedOpSlug] = useState("");
  const [error, setError] = useState("");
  const [activeGroup, setActiveGroup] = useState<"kisisel" | "operasyon" | "ogrenci">("kisisel");

  const load = useCallback(async () => {
    const [formRes, crmRes, catRes, docCatRes] = await Promise.all([
      fetch("/api/crm/form"),
      fetch(`/api/students/${studentId}/crm`),
      fetch("/api/document-categories"),
      fetch(`/api/students/${studentId}/documents-by-category`),
    ]);
    if (!formRes.ok || !crmRes.ok) {
      setError("Veriler yüklenemedi");
      setLoading(false);
      return;
    }
    const formJson = await formRes.json();
    const crmJson = await crmRes.json();
    const all = (formJson.sections ?? []) as Section[];
    const docSection = all.find((s: Section) => s.slug === "documents");
    setSections(docSection ? [docSection] : []);
    setCrmDocuments(crmJson.documents ?? []);
    if (catRes.ok) {
      const catJson = await catRes.json();
      const list = catJson.categories ?? [];
      setCategories(list);
      const opCats = list.filter((c: Category) => c.type === "OPERATION_UPLOADED");
      if (opCats.length > 0) setSelectedOpSlug((prev) => prev || opCats[0].slug);
    }
    if (docCatRes.ok) {
      const docCatJson = await docCatRes.json();
      setDocumentsByCat(docCatJson.documents ?? []);
    }
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadOperation(file: File) {
    if (!selectedOpSlug) return;
    setUploading("op");
    setError("");
    const form = new FormData();
    form.append("categorySlug", selectedOpSlug);
    form.append("file", file);
    const res = await fetch(`/api/students/${studentId}/documents-by-category/upload`, { method: "POST", body: form });
    setUploading(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Yükleme başarısız");
      return;
    }
    const doc = await res.json();
    setDocumentsByCat((prev) => [...prev, { id: doc.id, categorySlug: doc.categorySlug, categoryName: doc.categoryName, categoryType: "OPERATION_UPLOADED", fileName: doc.fileName, version: doc.version, status: doc.status, uploadedAt: doc.uploadedAt }]);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm text-slate-500">Belgeler yükleniyor</span>
        </div>
      </div>
    );
  }

  const fileFields = sections.flatMap((s) => s.fields).filter((f) => f.type === "FILE");
  const operationCategories = categories.filter((c) => c.type === "OPERATION_UPLOADED");
  const studentUploadCategories = categories.filter((c) => c.type === "STUDENT_UPLOADED");
  const docsByCategorySlug = documentsByCat.reduce((acc, d) => {
    if (!acc[d.categorySlug]) acc[d.categorySlug] = [];
    acc[d.categorySlug].push(d);
    return acc;
  }, {} as Record<string, DocByCat[]>);

  const revizeDocs = [
    ...crmDocuments.filter((d) => d.status === "REVISION_REQUESTED"),
    ...documentsByCat.filter((d) => d.status === "REVISION_REQUESTED"),
  ];

  const NavItem = ({ id, icon, label, count }: { id: typeof activeGroup; icon: string; label: string; count?: number }) => (
    <button
      type="button"
      onClick={() => setActiveGroup(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
        activeGroup === id
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
      }`}
    >
      <span className="material-icons-outlined text-xl">{icon}</span>
      <span className="font-medium text-sm">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
          {count}
        </span>
      )}
    </button>
  );

  const DocItem = ({ d, href }: { d: { fileName: string; version: number; status: string; uploadedAt: string }; href: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
    >
      <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 group-hover:bg-primary/10">
        <span className="material-icons-outlined text-slate-500 group-hover:text-primary text-xl">description</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{d.fileName}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          v{d.version} · {new Date(d.uploadedAt).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
        </p>
      </div>
      <span className={`shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-lg ${getDocumentStatusBadgeClass(d.status)}`}>
        {getDocumentStatusLabel(d.status)}
      </span>
    </a>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Sol navigasyon */}
      <aside className="lg:w-56 shrink-0">
        <nav className="sticky top-4 space-y-1 p-2 rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
          <NavItem id="kisisel" icon="folder_open" label="Kişisel Belgeler" />
          <NavItem id="operasyon" icon="business_center" label="Operasyon Belgeleri" />
          <NavItem id="ogrenci" icon="upload_file" label="Öğrenci Evrak" />
        </nav>
      </aside>

      {/* Ana içerik */}
      <div className="flex-1 min-w-0 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Revize uyarısı */}
        {revizeDocs.length > 0 && (
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200/80 dark:border-amber-800/50">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
              <span className="material-icons-outlined text-amber-600 dark:text-amber-400 text-2xl">info</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-amber-900 dark:text-amber-100">{revizeDocs.length} belge revize bekliyor</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">Öğrencinin bu belgeleri güncellemesi gerekiyor</p>
            </div>
            <details className="shrink-0">
              <summary className="text-sm font-medium text-amber-700 dark:text-amber-300 cursor-pointer hover:underline">Listele</summary>
              <ul className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                {revizeDocs.map((d) => (
                  <li key={d.id}>
                    <a
                      href={"categorySlug" in d ? `/api/students/${studentId}/documents-by-category/${d.id}` : `/api/students/${studentId}/documents/${d.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-amber-800 dark:text-amber-200 hover:underline truncate block"
                    >
                      {d.fileName}
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}

        {/* Kişisel Belgeler */}
        {activeGroup === "kisisel" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Kişisel Belgeler ve Tercümeler</h2>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
              {fileFields.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">Henüz alan tanımlanmamış</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {fileFields.map((field) => {
                    const docs = crmDocuments.filter((d) => d.fieldSlug === field.slug);
                    return (
                      <div key={field.id} className="p-4">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{field.label}</h3>
                        {docs.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Yüklenmedi</p>
                        ) : (
                          <div className="space-y-1">
                            {docs.map((d) => (
                              <DocItem key={d.id} d={{ ...d, version: d.version ?? 1, status: d.status ?? "UPLOADED" }} href={`/api/students/${studentId}/documents/${d.id}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Operasyon Belgeleri */}
        {activeGroup === "operasyon" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Operasyon Belgeleri</h2>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOpSlug || operationCategories[0]?.slug || ""}
                  onChange={(e) => setSelectedOpSlug(e.target.value)}
                  className="rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-sm py-2.5 px-4 min-w-[200px] focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {operationCategories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.name}</option>
                  ))}
                </select>
                <input type="file" accept=".pdf,.doc,.docx,image/*" className="hidden" id="op-upload" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadOperation(f); e.target.value = ""; }} disabled={!!uploading} />
                <label htmlFor="op-upload" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 cursor-pointer disabled:opacity-50 transition-colors shadow-md shadow-primary/20">
                  <span className="material-icons-outlined text-lg">upload</span>
                  {uploading ? "Yükleniyor" : "Yükle"}
                </label>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
              {operationCategories.some((c) => (docsByCategorySlug[c.slug] ?? []).length > 0) ? (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {operationCategories.map((cat) => {
                    const docs = docsByCategorySlug[cat.slug] ?? [];
                    if (docs.length === 0) return null;
                    return (
                      <div key={cat.id} className="p-4">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{cat.name}</h3>
                        <div className="space-y-1">
                          {docs.map((d) => <DocItem key={d.id} d={d} href={`/api/students/${studentId}/documents-by-category/${d.id}`} />)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <span className="material-icons-outlined text-4xl text-slate-300 dark:text-slate-600 mb-3 block">folder_open</span>
                  <p className="text-slate-500 text-sm">Henüz operasyon belgesi yüklenmedi</p>
                  <p className="text-xs text-slate-400 mt-1">Yukarıdan kategori seçip dosya yükleyebilirsiniz</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Öğrenci Evrak */}
        {activeGroup === "ogrenci" && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Öğrenci Evrakları</h2>
            <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 bg-white dark:bg-slate-900/50 overflow-hidden shadow-sm">
              {studentUploadCategories.length === 0 ? (
                <div className="p-12 text-center text-slate-500 text-sm">Kategori tanımlı değil</div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                  {studentUploadCategories.map((cat) => {
                    const docs = docsByCategorySlug[cat.slug] ?? [];
                    return (
                      <div key={cat.id} className="p-4">
                        <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{cat.name}</h3>
                        {docs.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Yüklenmedi</p>
                        ) : (
                          <div className="space-y-1">
                            {docs.map((d) => <DocItem key={d.id} d={d} href={`/api/students/${studentId}/documents-by-category/${d.id}`} />)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
