"use client";

import { useState, useEffect } from "react";
import { DURATION_OPTIONS } from "@/lib/catalog";
import { getOfferStatusLabel, ACTIVE_OFFER_STATUSES } from "@/lib/offer-status";

/** Kurum kartı (teklifte kurum + tarih aralığı veya hafta sayısı ile fiyat). */
type InstitutionService = { id: string; group: string; groupLabel: string; name: string; prices: { id: string; startDate: string; endDate: string; amount: number; currency: string }[]; priceBands?: { id: string; minWeeks: number; maxWeeks: number; pricePerWeek: number; currency: string }[] };
type Institution = { id: string; type: string; typeLabel: string; name: string; services: InstitutionService[] };

/** Katalog ürünü (attribute tabanlı: süre → fiyat). */
type CatalogRow = {
  id: string;
  city: string;
  schoolName: string;
  program: string;
  programGrup: string | null;
  priceByDuration: Record<string, number | null>;
  currency: string | null;
};

type OfferItem = {
  city?: string;
  schoolName: string;
  program: string;
  programGroup?: string;
  durationWeeks?: number;
  amount: number;
  currency?: string;
  institutionId?: string;
  startDate?: string;
  endDate?: string;
};

type Offer = {
  id: string;
  title: string;
  summary: string | null;
  status: string;
  sentAt: string | null;
  viewedAt: string | null;
  respondedAt: string | null;
  responseNote: string | null;
  createdAt: string;
  items: { city: string; schoolName: string; program: string; programGroup?: string; durationWeeks: number; amount: number; currency?: string }[];
};

function getAmount(row: CatalogRow, durationWeeks: number): number | null {
  return row.priceByDuration[String(durationWeeks)] ?? null;
}

export function StudentOffersSection({ studentId }: { studentId: string }) {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [catalog, setCatalog] = useState<{
    countries: string[];
    byCountry: Record<string, { cities: string[]; byCity: Record<string, CatalogRow[]> }>;
  }>({ countries: [], byCountry: {} });

  const fetchOffers = () => {
    fetch(`/api/students/${studentId}/offers`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOffers(d.offers ?? []))
      .catch(() => setOffers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOffers();
  }, [studentId]);

  useEffect(() => {
    if (modalOpen) {
      fetch("/api/germany-offers")
        .then((r) => r.json())
        .then((d) => setCatalog({
          countries: d.countries ?? [],
          byCountry: d.byCountry ?? {},
        }))
        .catch(() => setCatalog({ countries: [], byCountry: {} }));
    }
  }, [modalOpen]);

  const activeOffers = offers.filter((o) => ACTIVE_OFFER_STATUSES.includes(o.status as (typeof ACTIVE_OFFER_STATUSES)[number]));
  const pastOffers = offers.filter((o) => !ACTIVE_OFFER_STATUSES.includes(o.status as (typeof ACTIVE_OFFER_STATUSES)[number]));

  function OfferRow({ o }: { o: Offer }) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{o.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {getOfferStatusLabel(o.status)}
            {o.sentAt && ` · Gönderilme: ${new Date(o.sentAt).toLocaleDateString("tr-TR")}`}
            {o.respondedAt && ` · Yanıt: ${new Date(o.respondedAt).toLocaleDateString("tr-TR")}`}
          </p>
        </div>
        <a href={`/students/${studentId}/offers/${o.id}`} className="text-sm font-medium text-primary hover:underline">
          Görüntüle
        </a>
      </li>
    );
  }

  return (
    <>
      <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
        <div className="px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span className="material-icons-outlined text-primary">description</span>
            Teklifler
          </h3>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 flex items-center gap-2"
          >
            <span className="material-icons-outlined text-lg">add</span>
            Yeni teklif
          </button>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          {loading ? (
            <p className="text-slate-500 text-sm">Yükleniyor…</p>
          ) : (
            <>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="material-icons-outlined text-lg text-primary">pending_actions</span>
                  Aktif teklif{activeOffers.length !== 1 ? "ler" : ""}
                </h4>
                {activeOffers.length === 0 ? (
                  <p className="text-slate-500 text-sm py-1">Yanıt bekleyen teklif yok.</p>
                ) : (
                  <ul className="space-y-3">
                    {activeOffers.map((o) => (
                      <OfferRow key={o.id} o={o} />
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                  <span className="material-icons-outlined text-lg text-slate-500">history</span>
                  Geçmiş teklifler
                </h4>
                {pastOffers.length === 0 ? (
                  <p className="text-slate-500 text-sm py-1">Sonuçlanmış teklif yok.</p>
                ) : (
                  <ul className="space-y-3">
                    {pastOffers.map((o) => (
                      <OfferRow key={o.id} o={o} />
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {modalOpen && (
        <OfferFormModal
          studentId={studentId}
          catalog={catalog}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            fetchOffers();
          }}
        />
      )}
    </>
  );
}

function OfferFormModal({
  studentId,
  catalog,
  onClose,
  onSaved,
}: {
  studentId: string;
  catalog: { countries: string[]; byCountry: Record<string, { cities: string[]; byCity: Record<string, CatalogRow[]> }> };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [items, setItems] = useState<OfferItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"form" | "addItem" | "addItemKurum">("form");
  const [addItemSource, setAddItemSource] = useState<"katalog" | "kurum">("katalog");
  const [institutions, setInstitutions] = useState<Institution[]>([]);

  useEffect(() => {
    fetch("/api/institutions")
      .then((r) => r.json())
      .then((d) => setInstitutions(d.institutions ?? []))
      .catch(() => setInstitutions([]));
  }, []);
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [kurumStartDate, setKurumStartDate] = useState("");
  const [kurumEndDate, setKurumEndDate] = useState("");
  const [kurumWeeks, setKurumWeeks] = useState("");
  const [kurumPrice, setKurumPrice] = useState<{ amount: number; currency: string; serviceName: string; institutionName: string; durationWeeks?: number } | null>(null);
  const [kurumPriceLoading, setKurumPriceLoading] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());
  const [selectedDuration, setSelectedDuration] = useState(2);

  const countryData = selectedCountry ? catalog.byCountry[selectedCountry] : null;
  const cities = countryData?.cities ?? [];
  const rows = selectedCountry && selectedCity && countryData?.byCity ? (countryData.byCity[selectedCity] ?? []) : [];
  const byProgramGrup = rows.reduce<Record<string, CatalogRow[]>>((acc, r) => {
    const key = r.programGrup || "(Grup yok)";
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const selectedRows = rows.filter((r) => selectedRowIds.has(r.id));
  const canAddSelected = selectedRows.length > 0 && selectedRows.every((r) => getAmount(r, selectedDuration) != null);
  const inst = institutions.find((i) => i.id === selectedInstitution);
  const service = inst?.services.find((s) => s.id === selectedService);
  const useWeeksPricing = (service?.priceBands?.length ?? 0) > 0;

  async function fetchKurumPrice() {
    if (!selectedService) return;
    if (useWeeksPricing) {
      const weeks = parseInt(kurumWeeks, 10);
      if (isNaN(weeks) || weeks < 1) return;
      setKurumPriceLoading(true);
      setKurumPrice(null);
      try {
        const res = await fetch(`/api/institution-prices?serviceId=${encodeURIComponent(selectedService)}&weeks=${weeks}`);
        const data = await res.json();
        if (res.ok && data.price) setKurumPrice({ ...data.price, durationWeeks: weeks });
        else setKurumPrice(null);
      } catch {
        setKurumPrice(null);
      } finally {
        setKurumPriceLoading(false);
      }
      return;
    }
    if (!kurumStartDate || !kurumEndDate) return;
    setKurumPriceLoading(true);
    setKurumPrice(null);
    try {
      const res = await fetch(`/api/institution-prices?serviceId=${encodeURIComponent(selectedService)}&startDate=${encodeURIComponent(kurumStartDate)}&endDate=${encodeURIComponent(kurumEndDate)}`);
      const data = await res.json();
      if (res.ok && data.price) setKurumPrice({ amount: data.price.amount, currency: data.price.currency, serviceName: data.price.serviceName, institutionName: data.price.institutionName });
      else setKurumPrice(null);
    } catch {
      setKurumPrice(null);
    } finally {
      setKurumPriceLoading(false);
    }
  }

  function addKurumItem() {
    if (!kurumPrice || !inst || !service) return;
    const newItem: OfferItem = {
      schoolName: kurumPrice.institutionName,
      program: kurumPrice.serviceName,
      amount: kurumPrice.amount,
      currency: kurumPrice.currency,
      institutionId: inst.id,
      durationWeeks: kurumPrice.durationWeeks,
      startDate: kurumStartDate || undefined,
      endDate: kurumEndDate || undefined,
    };
    setItems((prev) => [...prev, newItem]);
    setKurumPrice(null);
    setSelectedInstitution("");
    setSelectedService("");
    setKurumStartDate("");
    setKurumEndDate("");
    setKurumWeeks("");
    setStep("form");
  }

  function toggleRow(rowId: string) {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }

  function addSelectedItems() {
    if (!canAddSelected) return;
    const newItems: OfferItem[] = selectedRows.map((row) => {
      const amt = getAmount(row, selectedDuration)!;
      return {
        city: row.city,
        schoolName: row.schoolName,
        program: row.program,
        programGroup: row.programGrup ?? undefined,
        durationWeeks: selectedDuration,
        amount: amt,
        currency: row.currency ?? undefined,
      };
    });
    setItems((prev) => [...prev, ...newItems]);
    setSelectedRowIds(new Set());
    setStep("form");
  }

  async function submit(send: boolean) {
    if (!title.trim()) {
      setError("Başlık girin.");
      return;
    }
    setError("");
    setSaving(true);
    const res = await fetch(`/api/students/${studentId}/offers`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        summary: summary.trim() || undefined,
        items: items.length > 0 ? items : undefined,
        status: send ? "SENT" : "DRAFT",
      }),
    });
    setSaving(false);
    if (res.ok) onSaved();
    else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Kaydedilemedi.");
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl my-8 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Yeni teklif</h3>
          <button type="button" onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500">
            <span className="material-icons-outlined">close</span>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {step === "form" ? (
            <>
              {error && (
                <p className="text-sm text-red-600 dark:text-red-400 mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-900/20">{error}</p>
              )}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Başlık *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    placeholder="Örn. 2025 Berlin Yoğun Almanca Paketi"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Özet (isteğe bağlı)</label>
                  <textarea
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">Kalemler (katalogdan)</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => { setStep("addItem"); setAddItemSource("katalog"); }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        + Katalogdan ekle
                      </button>
                      <button
                        type="button"
                        onClick={() => { setStep("addItemKurum"); setAddItemSource("kurum"); setSelectedInstitution(""); setSelectedService(""); setKurumStartDate(""); setKurumEndDate(""); setKurumWeeks(""); setKurumPrice(null); }}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        + Kurum kartından ekle
                      </button>
                    </div>
                  </div>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500 py-2">Henüz kalem eklenmedi. İsteğe bağlı.</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((it, i) => (
                        <li key={i} className="flex justify-between items-center text-sm py-2 border-b border-slate-100 dark:border-slate-800">
                          <span>
                            {it.startDate && it.endDate ? (
                              <>{it.schoolName} · {it.program} · {it.startDate}–{it.endDate} · {it.amount} {it.currency ?? "€"}</>
                            ) : (
                              <>{it.city ?? it.schoolName} · {it.schoolName}{it.programGroup ? ` · ${it.programGroup}` : ""} · {it.program} ({(it.durationWeeks ?? 0)} hf) · {it.amount} {it.currency ?? "€"}</>
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
                            className="text-red-500 hover:underline"
                          >
                            Kaldır
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : step === "addItemKurum" ? (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Kurum ve hizmet seçin. Haftalık fiyat bandı varsa hafta sayısıyla otomatik fiyat hesaplanır.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kurum</label>
                  <select
                    value={selectedInstitution}
                    onChange={(e) => { setSelectedInstitution(e.target.value); setSelectedService(""); setKurumPrice(null); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value="">Seçin</option>
                    {institutions.map((i) => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>
                </div>
                {selectedInstitution && inst && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hizmet</label>
                    <select
                      value={selectedService}
                      onChange={(e) => { setSelectedService(e.target.value); setKurumPrice(null); }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seçin</option>
                      {inst.services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name} {(s.priceBands?.length ?? 0) > 0 ? "(haftalık)" : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedService && service && (
                  useWeeksPricing ? (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hafta sayısı</label>
                      <input
                        type="number"
                        min={1}
                        value={kurumWeeks}
                        onChange={(e) => { setKurumWeeks(e.target.value); setKurumPrice(null); }}
                        placeholder="Örn. 10"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      />
                      <button
                        type="button"
                        onClick={fetchKurumPrice}
                        disabled={kurumPriceLoading || !kurumWeeks || parseInt(kurumWeeks, 10) < 1}
                        className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
                      >
                        {kurumPriceLoading ? "Hesaplanıyor…" : "Fiyat hesapla"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Başlangıç tarihi</label>
                        <input type="date" value={kurumStartDate} onChange={(e) => { setKurumStartDate(e.target.value); setKurumPrice(null); }} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bitiş tarihi</label>
                        <input type="date" value={kurumEndDate} onChange={(e) => { setKurumEndDate(e.target.value); setKurumPrice(null); }} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800" />
                      </div>
                      <button
                        type="button"
                        onClick={fetchKurumPrice}
                        disabled={kurumPriceLoading || !kurumStartDate || !kurumEndDate}
                        className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
                      >
                        {kurumPriceLoading ? "Hesaplanıyor…" : "Fiyat hesapla"}
                      </button>
                    </>
                  )
                )}
                {kurumPrice && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{kurumPrice.institutionName} · {kurumPrice.serviceName}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{kurumPrice.amount.toFixed(2)} {kurumPrice.currency}{kurumPrice.durationWeeks ? ` (${kurumPrice.durationWeeks} hf)` : ""}</p>
                    <button type="button" onClick={addKurumItem} className="mt-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium">Kaleme ekle</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Ülke ve şehir seçin, ardından program ve süre seçip ekleyin.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ülke</label>
                  <select
                    value={selectedCountry}
                    onChange={(e) => { setSelectedCountry(e.target.value); setSelectedCity(""); setSelectedRowIds(new Set()); }}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                  >
                    <option value="">Seçin</option>
                    {catalog.countries.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                {selectedCountry && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Şehir</label>
                    <select
                      value={selectedCity}
                      onChange={(e) => { setSelectedCity(e.target.value); setSelectedRowIds(new Set()); }}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                    >
                      <option value="">Seçin</option>
                      {cities.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                )}
                {selectedCountry && selectedCity && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Süre (seçilen tüm programlar için)</label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(Number(e.target.value))}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800"
                      >
                        {DURATION_OPTIONS.map((d) => (
                          <option key={d.value} value={d.value}>{d.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Program grubu / Program (birden fazla seçebilirsiniz)</label>
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-600 rounded-xl p-2">
                        {Object.entries(byProgramGrup).map(([grup, list]) => (
                          <div key={grup}>
                            <p className="text-xs font-semibold text-slate-500 uppercase mb-1">{grup}</p>
                            {list.map((row) => {
                              const amt = getAmount(row, selectedDuration);
                              const hasPrice = amt != null;
                              return (
                                <label key={row.id} className="flex items-center gap-2 py-1.5 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={selectedRowIds.has(row.id)}
                                    onChange={() => toggleRow(row.id)}
                                    disabled={!hasPrice}
                                    className="text-primary rounded"
                                  />
                                  <span className="text-sm">{row.program}</span>
                                  {hasPrice && <span className="text-xs text-slate-500">({amt} {row.currency ?? "€"})</span>}
                                  {!hasPrice && <span className="text-xs text-amber-600">(bu süre için fiyat yok)</span>}
                                </label>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                      {selectedRows.length > 0 && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                          {selectedRows.length} program seçildi. Seçilen süre: {DURATION_OPTIONS.find((d) => d.value === selectedDuration)?.label ?? selectedDuration} hafta.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-2">
          {step === "addItem" || step === "addItemKurum" ? (
            <>
              <button type="button" onClick={() => setStep("form")} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium">
                Geri
              </button>
              {step === "addItem" && (
                <button
                  type="button"
                  onClick={addSelectedItems}
                  disabled={!canAddSelected}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
                >
                  Seçilenleri ekle ({selectedRows.length})
                </button>
              )}
            </>
          ) : (
            <>
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium">
                İptal
              </button>
              <button
                type="button"
                onClick={() => submit(false)}
                disabled={saving}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Kaydediliyor…" : "Taslak kaydet"}
              </button>
              <button
                type="button"
                onClick={() => submit(true)}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Gönderiliyor…" : "Gönder"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
