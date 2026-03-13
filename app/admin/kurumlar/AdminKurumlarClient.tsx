"use client";

import { useState, useEffect, useCallback } from "react";

type InstitutionPrice = { id: string; startDate: string; endDate: string; amount: number; currency: string };
type InstitutionPriceBand = { id: string; minWeeks: number; maxWeeks: number; pricePerWeek: number; currency: string };
type InstitutionService = { id: string; group: string; name: string; prices: InstitutionPrice[]; priceBands: InstitutionPriceBand[] };
type InstitutionImage = { id: string; filePath: string; sortOrder: number };
type Institution = {
  id: string;
  type: string;
  name: string;
  logoUrl: string | null;
  description: string | null;
  address: string | null;
  catalogPdfPath: string | null;
  images: InstitutionImage[];
  services: InstitutionService[];
};

const TYPE_LABELS: Record<string, string> = { UNIVERSITY: "Üniversite", LANGUAGE_COURSE: "Dil Kursu", ACCOMMODATION: "Konaklama", OTHER: "Diğer" };
const GROUP_LABELS: Record<string, string> = { EDUCATION: "Eğitim", ACCOMMODATION: "Konaklama", OTHER: "Diğer" };

export function AdminKurumlarClient() {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("UNIVERSITY");
  const [addServiceModal, setAddServiceModal] = useState<{ institutionId: string } | null>(null);
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceGroup, setNewServiceGroup] = useState("EDUCATION");
  const [addPriceModal, setAddPriceModal] = useState<{ serviceId: string } | null>(null);
  const [addBandModal, setAddBandModal] = useState<{ serviceId: string } | null>(null);
  const [newPriceStart, setNewPriceStart] = useState("");
  const [newPriceEnd, setNewPriceEnd] = useState("");
  const [newPriceAmount, setNewPriceAmount] = useState("");
  const [newPriceCurrency, setNewPriceCurrency] = useState("EUR");
  const [newBandMinWeeks, setNewBandMinWeeks] = useState("1");
  const [newBandMaxWeeks, setNewBandMaxWeeks] = useState("0");
  const [newBandPricePerWeek, setNewBandPricePerWeek] = useState("");
  const [newBandCurrency, setNewBandCurrency] = useState("EUR");
  const [submitting, setSubmitting] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState<string | null>(null);
  const [uploadingCatalog, setUploadingCatalog] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/institutions");
      const data = await res.json();
      if (res.ok) setInstitutions(data.institutions ?? []);
    } catch {
      setInstitutions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addInstitution = async () => {
    if (!newName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/institutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newName.trim(), type: newType }),
      });
      if (res.ok) {
        setAddModalOpen(false);
        setNewName("");
        await load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Eklenemedi (${res.status})`);
      }
    } catch (e) {
      alert("Bağlantı hatası. Sunucuya ulaşılamıyor olabilir.");
    } finally {
      setSubmitting(false);
    }
  };

  const addService = async () => {
    if (!addServiceModal || !newServiceName.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/institutions/${addServiceModal.institutionId}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newServiceName.trim(), group: newServiceGroup }),
      });
      if (res.ok) {
        setAddServiceModal(null);
        setNewServiceName("");
        await load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Eklenemedi (${res.status})`);
      }
    } catch (e) {
      alert("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  };

  const addPrice = async () => {
    if (!addPriceModal || !newPriceStart || !newPriceEnd || !newPriceAmount) return;
    const amt = parseFloat(newPriceAmount);
    if (isNaN(amt) || amt < 0) { alert("Geçerli tutar girin"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/institutions/services/${addPriceModal.serviceId}/prices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          startDate: newPriceStart,
          endDate: newPriceEnd,
          amount: amt,
          currency: newPriceCurrency,
        }),
      });
      if (res.ok) {
        setAddPriceModal(null);
        setNewPriceStart("");
        setNewPriceEnd("");
        setNewPriceAmount("");
        await load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Eklenemedi (${res.status})`);
      }
    } catch (e) {
      alert("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  };

  const addBand = async () => {
    if (!addBandModal || !newBandPricePerWeek) return;
    const minW = parseInt(newBandMinWeeks, 10);
    const maxW = parseInt(newBandMaxWeeks, 10);
    const amt = parseFloat(newBandPricePerWeek);
    if (isNaN(minW) || minW < 0 || isNaN(maxW) || maxW < 0 || isNaN(amt) || amt < 0) {
      alert("Geçerli değerler girin. Bitiş haftası 0 = sınırsız.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/institutions/services/${addBandModal.serviceId}/bands`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          minWeeks: minW,
          maxWeeks: maxW,
          pricePerWeek: amt,
          currency: newBandCurrency,
        }),
      });
      if (res.ok) {
        setAddBandModal(null);
        setNewBandMinWeeks("1");
        setNewBandMaxWeeks("0");
        setNewBandPricePerWeek("");
        await load();
      } else {
        const d = await res.json().catch(() => ({}));
        alert(d.error ?? `Eklenemedi (${res.status})`);
      }
    } catch (e) {
      alert("Bağlantı hatası.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteBand = async (serviceId: string, bandId: string) => {
    if (!confirm("Bu fiyat bandını silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`/api/admin/institutions/services/${serviceId}/bands/${bandId}`, { method: "DELETE" });
      if (res.ok) await load();
      else alert("Silinemedi");
    } catch { alert("Silinemedi"); }
  };

  const deleteInstitution = async (id: string) => {
    if (!confirm("Bu kurumu silmek istediğinize emin misiniz? Tüm hizmetler ve fiyatlar silinecek.")) return;
    try {
      const res = await fetch(`/api/admin/institutions/${id}`, { method: "DELETE" });
      if (res.ok) await load();
      else alert("Silinemedi");
    } catch { alert("Silinemedi"); }
  };

  const uploadGallery = async (institutionId: string, file: File) => {
    setUploadingGallery(institutionId);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/institutions/${institutionId}/gallery`, { method: "POST", body: form });
      if (res.ok) await load();
      else {
        const d = await res.json();
        alert(d.error ?? "Yüklenemedi");
      }
    } finally {
      setUploadingGallery(null);
    }
  };

  const deleteGalleryImage = async (institutionId: string, imageId: string) => {
    if (!confirm("Bu görseli silmek istiyor musunuz?")) return;
    try {
      const res = await fetch(`/api/admin/institutions/${institutionId}/gallery/${imageId}`, { method: "DELETE" });
      if (res.ok) await load();
    } catch { alert("Silinemedi"); }
  };

  const uploadCatalog = async (institutionId: string, file: File) => {
    setUploadingCatalog(institutionId);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`/api/admin/institutions/${institutionId}/catalog`, { method: "POST", body: form });
      if (res.ok) await load();
      else {
        const d = await res.json();
        alert(d.error ?? "Yüklenemedi");
      }
    } finally {
      setUploadingCatalog(null);
    }
  };

  if (loading) return <div className="py-12 text-center text-slate-500">Yükleniyor…</div>;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90"
        >
          <span className="material-icons-outlined text-lg">add</span>
          Kurum ekle
        </button>
      </div>

      <div className="space-y-4">
        {institutions.length === 0 ? (
          <p className="text-slate-500 py-8 text-center">Henüz kurum eklenmemiş. Kurum ekleyip hizmet ve fiyat tanımlayın.</p>
        ) : (
          institutions.map((i) => (
            <div key={i.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">{TYPE_LABELS[i.type] ?? i.type}</span>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white mt-1">{i.name}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => deleteInstitution(i.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  title="Sil"
                >
                  <span className="material-icons-outlined text-lg">delete</span>
                </button>
              </div>
              {/* Galeri */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-slate-500">Galeri</p>
                <div className="flex flex-wrap gap-2">
                  {(i.images ?? []).map((img) => (
                    <div key={img.id} className="relative group">
                      <img src={`/api/admin/institutions/${i.id}/gallery/${img.id}`} alt="" className="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-600" />
                      <button
                        type="button"
                        onClick={() => deleteGalleryImage(i.id, img.id)}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Sil"
                      >
                        <span className="material-icons-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                  <label className={`w-20 h-20 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 ${uploadingGallery === i.id ? "opacity-50 pointer-events-none" : ""}`}>
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadGallery(i.id, f); e.target.value = ""; }} disabled={!!uploadingGallery} />
                    <span className="material-icons-outlined text-slate-400">{uploadingGallery === i.id ? "hourglass_empty" : "add_photo_alternate"}</span>
                  </label>
                </div>
              </div>

              {/* Katalog PDF */}
              <div className="space-y-2 mb-4">
                <p className="text-xs font-medium text-slate-500">Katalog PDF</p>
                {i.catalogPdfPath ? (
                  <div className="flex items-center gap-2">
                    <a href={`/api/admin/institutions/${i.id}/catalog`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      <span className="material-icons-outlined text-lg">picture_as_pdf</span>
                      Katalogu indir
                    </a>
                    <label className={`inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary cursor-pointer ${uploadingCatalog === i.id ? "opacity-50" : ""}`}>
                      <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCatalog(i.id, f); e.target.value = ""; }} disabled={!!uploadingCatalog} />
                      <span className="material-icons-outlined text-lg">refresh</span>
                      {uploadingCatalog === i.id ? "Yükleniyor…" : "Yenile"}
                    </label>
                  </div>
                ) : (
                  <label className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-sm cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 ${uploadingCatalog === i.id ? "opacity-50" : ""}`}>
                    <input type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadCatalog(i.id, f); e.target.value = ""; }} disabled={!!uploadingCatalog} />
                    <span className="material-icons-outlined text-lg">upload_file</span>
                    {uploadingCatalog === i.id ? "Yükleniyor…" : "PDF yükle"}
                  </label>
                )}
              </div>

              <div className="space-y-3">
                {i.services.length === 0 ? (
                  <p className="text-sm text-slate-500">Hizmet yok.</p>
                ) : (
                  i.services.map((s) => (
                    <div key={s.id} className="rounded-xl border border-slate-200 dark:border-slate-700 p-4 bg-slate-50/50 dark:bg-slate-800/30">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-medium text-slate-500">{GROUP_LABELS[s.group] ?? s.group}</span>
                        <span className="font-medium text-slate-800 dark:text-white">{s.name}</span>
                        <button
                          type="button"
                          onClick={() => { setAddPriceModal({ serviceId: s.id }); setNewPriceStart(""); setNewPriceEnd(""); setNewPriceAmount(""); }}
                          className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                        >
                          Fiyat ekle
                        </button>
                      </div>
                      {s.prices.length === 0 ? (
                        <p className="text-xs text-slate-500">Fiyat tanımlanmamış.</p>
                      ) : (
                        <ul className="text-sm space-y-1">
                          {s.prices.map((p) => (
                            <li key={p.id} className="flex justify-between">
                              <span>{p.startDate} – {p.endDate}</span>
                              <span className="font-medium">{p.amount.toFixed(2)} {p.currency}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600">
                        <p className="text-xs font-medium text-slate-500 mb-1">Haftalık fiyat bandları</p>
                        {(s.priceBands ?? []).length === 0 ? (
                          <p className="text-xs text-slate-500">Band yok.</p>
                        ) : (
                          <ul className="text-sm space-y-1">
                            {(s.priceBands ?? []).map((b) => (
                              <li key={b.id} className="flex justify-between items-center">
                                <span>{b.minWeeks} – {b.maxWeeks === 0 ? "∞" : b.maxWeeks} hf</span>
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">{b.pricePerWeek.toFixed(2)} {b.currency}/hf</span>
                                  <button type="button" onClick={() => deleteBand(s.id, b.id)} className="p-0.5 text-slate-400 hover:text-red-600" title="Sil"><span className="material-icons-outlined text-sm">close</span></button>
                                </span>
                              </li>
                            ))}
                          </ul>
                        )}
                        <button
                          type="button"
                          onClick={() => { setAddBandModal({ serviceId: s.id }); setNewBandMinWeeks("1"); setNewBandMaxWeeks("0"); setNewBandPricePerWeek(""); }}
                          className="text-xs mt-1 text-primary hover:underline"
                        >
                          + Haftalık band ekle
                        </button>
                      </div>
                    </div>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => { setAddServiceModal({ institutionId: i.id }); setNewServiceName(""); }}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <span className="material-icons-outlined text-lg">add</span>
                  Hizmet ekle
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Kurum ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tür</label>
                <select value={newType} onChange={(e) => setNewType(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm">
                  {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Kurum adı *</label>
                <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Kurum adı" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setAddModalOpen(false)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">İptal</button>
              <button type="button" onClick={addInstitution} disabled={submitting || !newName.trim()} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{submitting ? "Ekleniyor…" : "Ekle"}</button>
            </div>
          </div>
        </div>
      )}

      {addServiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Hizmet ekle</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Grup</label>
                <select value={newServiceGroup} onChange={(e) => setNewServiceGroup(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm">
                  {Object.entries(GROUP_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Hizmet adı *</label>
                <input value={newServiceName} onChange={(e) => setNewServiceName(e.target.value)} placeholder="Hizmet adı" className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setAddServiceModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">İptal</button>
              <button type="button" onClick={addService} disabled={submitting || !newServiceName.trim()} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{submitting ? "Ekleniyor…" : "Ekle"}</button>
            </div>
          </div>
        </div>
      )}

      {addPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Fiyat ekle</h3>
            <p className="text-xs text-slate-500 mb-4">Başlangıç ve bitiş tarihi aralığında geçerli fiyat.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Başlangıç tarihi *</label>
                <input type="date" value={newPriceStart} onChange={(e) => setNewPriceStart(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bitiş tarihi *</label>
                <input type="date" value={newPriceEnd} onChange={(e) => setNewPriceEnd(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tutar *</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" value={newPriceAmount} onChange={(e) => setNewPriceAmount(e.target.value)} placeholder="0" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
                  <select value={newPriceCurrency} onChange={(e) => setNewPriceCurrency(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm w-24">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setAddPriceModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">İptal</button>
              <button type="button" onClick={addPrice} disabled={submitting || !newPriceStart || !newPriceEnd || !newPriceAmount} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{submitting ? "Ekleniyor…" : "Ekle"}</button>
            </div>
          </div>
        </div>
      )}

      {addBandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Haftalık fiyat bandı ekle</h3>
            <p className="text-xs text-slate-500 mb-4">Örn. 1–7 hf → 230 €/hf, 8–24 hf → 180 €/hf. Bitiş 0 = sınırsız.</p>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Başlangıç haftası *</label>
                  <input type="number" min={1} value={newBandMinWeeks} onChange={(e) => setNewBandMinWeeks(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bitiş haftası (0=sınırsız)</label>
                  <input type="number" min={0} value={newBandMaxWeeks} onChange={(e) => setNewBandMaxWeeks(e.target.value)} className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Haftalık ücret *</label>
                <div className="flex gap-2">
                  <input type="number" step="0.01" value={newBandPricePerWeek} onChange={(e) => setNewBandPricePerWeek(e.target.value)} placeholder="0" className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm" />
                  <select value={newBandCurrency} onChange={(e) => setNewBandCurrency(e.target.value)} className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-sm w-24">
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button type="button" onClick={() => setAddBandModal(null)} className="flex-1 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-medium">İptal</button>
              <button type="button" onClick={addBand} disabled={submitting || !newBandPricePerWeek} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50">{submitting ? "Ekleniyor…" : "Ekle"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
