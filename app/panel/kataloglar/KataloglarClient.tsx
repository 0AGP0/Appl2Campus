"use client";

import { useState, useEffect } from "react";

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

export function KataloglarClient() {
  const [list, setList] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((data) => {
        const lang = (data.institutions ?? []).filter((i: Institution) => i.type === "LANGUAGE_COURSE");
        setList(lang);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <span className="material-icons-outlined animate-spin text-3xl text-primary">progress_activity</span>
      </div>
    );
  }

  if (list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-8 text-center">
        <span className="material-icons-outlined text-4xl text-slate-400">menu_book</span>
        <p className="mt-2 text-slate-600 dark:text-slate-400">Henüz dil kursu kurumu eklenmemiş.</p>
        <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Kurum kartları admin panelinden yönetilir.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Dil kursu katalogları</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Görüşme ve sunumlarda güncel bilgi için katalogları indirebilirsiniz.
        </p>
      </div>
      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
        {list.map((i) => (
          <li key={i.id} className="px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-slate-800 dark:text-slate-200">{i.name}</span>
                {i.isPartner && (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-primary/20 text-primary">Partner</span>
                )}
              </div>
              {i.address && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-md">{i.address}</p>}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {i.contactEmail && (
                <a href={`mailto:${i.contactEmail}`} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500" title="E-posta">
                  <span className="material-icons-outlined text-lg">email</span>
                </a>
              )}
              {i.catalogPdfPath ? (
                <a
                  href={`/api/admin/institutions/${i.id}/catalog`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  <span className="material-icons-outlined text-lg">picture_as_pdf</span>
                  Katalogu indir
                </a>
              ) : (
                <span className="text-xs text-slate-400">Katalog yok</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
