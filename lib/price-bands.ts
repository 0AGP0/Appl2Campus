/** Haftalık fiyat bandı: minWeeks–maxWeeks aralığında haftalık ücret. maxWeeks=0 sınırsız. */
export type PriceBand = { minWeeks: number; maxWeeks: number; pricePerWeek: number; currency: string };

/** Hafta sayısına göre toplam tutarı hesaplar. Bandlar minWeeks'e göre sıralı gelmeli. */
export function calculatePriceFromBands(bands: PriceBand[], weeks: number): { total: number; currency: string } | null {
  if (weeks <= 0 || bands.length === 0) return null;
  let remaining = weeks;
  let total = 0;
  const currency = bands[0]?.currency ?? "EUR";
  for (const b of bands) {
    if (remaining <= 0) break;
    const bandMax = b.maxWeeks === 0 ? 9999 : b.maxWeeks;
    const weeksInBand = Math.min(remaining, bandMax - b.minWeeks + 1);
    if (weeksInBand > 0) {
      total += weeksInBand * b.pricePerWeek;
      remaining -= weeksInBand;
    }
  }
  if (remaining > 0) return null;
  return { total, currency };
}
