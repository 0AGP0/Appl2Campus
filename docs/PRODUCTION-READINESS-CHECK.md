# Production Readiness – Panel İnceleme Raporu

Kullanıcı senaryolarına göre paneller ve API’ler taranmıştır. Mock veri, TODO veya “yakında” ifadesi aranmış; tüm sayfalar ve API’ler gerçek veri kullanıyor.

---

## 1. Giriş / Landing

- **`/`** – Rol bazlı yönlendirme (ADMIN → /admin, STUDENT → /dashboard, OPERATION → /operasyon/inbox, diğer → /panel). Özellik kartları statik metin (ürün tanıtımı), mock değil.
- **`/login`** – NextAuth, gerçek oturum.
- **`/register`** – Gerçek kayıt (Student + User oluşturuluyor), rate limit var.
- **`/gizlilik`, `/kullanim-kosullari`** – Statik sayfalar.

**Sonuç:** Production için uygun. `NEXTAUTH_URL` production’da ortam değişkeni ile set edilmeli (localhost sadece geliştirme).

---

## 2. Öğrenci Paneli (`/dashboard`)

| Sayfa | Veri kaynağı | Mock? | Not |
|-------|----------------|-------|-----|
| Ana Sayfa | `prisma.student`, `prisma.stage`, Gmail status | Hayır | Gmail bağlı değilse “Gmail bağla” CTA; bağlıysa özet panel. |
| Duyurular | `/api/announcements` → DB | Hayır | |
| Profilim | `/api/crm/form`, `/api/students/[id]/crm`, `/api/me` | Hayır | CRM bölümleri DB’den (CrmSection). |
| Başvurularım | `/api/me/applications` | Hayır | |
| Teklifler | `/api/me/offers` | Hayır | |
| Dökümanlar | `/api/crm/form`, `/api/students/[id]/crm`, `/api/document-categories`, `/api/students/[id]/documents-by-category` | Hayır | Kategoriler boş olabilir; UI boş liste gösterir. |
| Vize Bilgileri | `/api/students/[id]/vize`, upload, doc | Hayır | |
| Dil Kursu | `/api/students/[id]/dil-kursu`, upload, doc | Hayır | |
| Eğitim Videoları | Sabit YouTube playlist ID (Revize 2) | Hayır | Embed gerçek playlist. |
| Ayarlar | `/api/me`, Gmail disconnect | Hayır | |
| Inbox | `/api/students/[id]/emails` vb. | Hayır | Gmail bağlı değilse compose/mailler disabled. |

**Placeholder’lar:** Sadece input hint (örn. “Ad, ID veya e-posta ile ara…”). Bunlar mock değil.

**Sonuç:** Tüm özellikler gerçek API/DB ile çalışıyor. Boş veri durumları “Henüz … yok” vb. mesajlarla ele alınmış.

---

## 3. Danışman / Panel (`/panel`, `/students`)

| Sayfa / Özellik | Veri kaynağı | Mock? | Not |
|------------------|--------------|-------|-----|
| Ana Sayfa | `getStudentsForUser`, duyurular | Hayır | |
| Öğrenci listesi | `/api/students` (filtreler: aşama, konaklama, dil kursu şehri, stageNot) | Hayır | |
| Tablo / Kanban | Aynı API; sürükle-bırak `PATCH /api/students/[id]` (stage) | Hayır | Stages boşsa fallback `[{ slug: "lead", name: "Lead" }]`. |
| Öğrenci detay (Profil, Belgeler, Vize, Dil Kursu, Başvurular, Teklifler, Inbox) | İlgili `/api/students/[id]/...` route’ları | Hayır | |
| Notlar (sağ sidebar) | `/api/students/[id]/notes` | Hayır | |
| Müsait saatler | `/api/consultants/[id]/slots` | Hayır | |
| Görevler | `/api/tasks`, `/api/me/tasks` | Hayır | |
| Duyurular | `/api/announcements` | Hayır | |
| Dil kursu katalogları | `/api/institutions` (LANGUAGE_COURSE) | Hayır | Kurum yoksa “Henüz dil kursu kurumu eklenmemiş”. |

**Sonuç:** Tamamı gerçek veri. Mock yok.

---

## 4. Operasyon (`/operasyon/inbox`)

- Inbox: `/api/operasyon/inbox` – tüm öğrenci mailleri gerçek DB/Gmail.
- Mesaj detay: `/api/operasyon/emails/[id]` vb.

**Sonuç:** Uygun.

---

## 5. Admin (`/admin`)

| Sayfa | Veri kaynağı | Mock? | Not |
|-------|----------------|-------|-----|
| Özet | `/api/admin/stats` vb. | Hayır | |
| Danışmanlar | `/api/users`, CRUD | Hayır | |
| Öğrenciler | Aynı liste API’leri | Hayır | |
| Aşamalar | `/api/admin/stages`, `/api/stages` | Hayır | En az 1 aşama zorunlu (silme kontrolü). |
| Katalog (Almanya) | CSV import, `prisma.catalogItem` | Hayır | Boş başlanabilir. |
| Katalog (genel) | `/api/admin/germany-offers` (CatalogItem) | Hayır | |
| Kurum kartları | `/api/admin/institutions`, services, prices, **bands** | Hayır | Tarih bazlı fiyat + haftalık band. |
| Duyurular | `/api/admin/announcements` | Hayır | |

**Sonuç:** Tüm CRUD ve listeler DB ile. Mock yok.

---

## 6. API Özeti

- **Auth:** NextAuth, register (rate limit + gerçek User/Student).
- **Öğrenci:** students, vize, dil-kursu, notes, offers, documents, crm, emails, documents-by-category – hepsi Prisma/DB veya Gmail.
- **Kurum / fiyat:** institutions, institution-prices (tarih + hafta), admin institutions + bands.
- **Teklif:** offers CRUD, respond (kabulde program bilgileri otomatik dolduruluyor).
- **CRM:** crm/form (CrmSection/fields), crm/values, crm/documents – DB.
- **Stages:** stages, admin/stages – DB; liste tarafında stages boşsa fallback var.

Hiçbir route sabit mock array/object dönmüyor.

---

## 7. Dikkat Edilmesi Gerekenler (Product İçin)

1. **Seed / ilk kurulum:** Production’da en az bir kez `prisma db push` (veya migrate) + gerekirse seed (Stage, CrmSection, CrmField, DocumentCategory). Aşama yoksa Kanban/lista fallback ile çalışır ama admin’den en az bir aşama eklenmeli.
2. **OAuth callback:** `NEXTAUTH_URL` production URL olmalı (örn. `https://app.apply2campus.com`). Kod tarafında localhost sadece default; env ile override ediliyor.
3. **Dosya yükleme:** `UPLOAD_DIR` veya varsayılan `data/uploads` yazılabilir olmalı; aksi halde belge/vize/dil kursu yüklemeleri hata verir.
4. **Boş katalog:** Teklifte “Katalogdan ekle” kullanılıyorsa CatalogItem (Almanya kataloğu) veya kurumların doldurulması gerekir; boş bırakılırsa liste boş görünür, davranış doğru.

---

## 8. Genel Sonuç

- **Mock data:** Yok; tüm listeler ve detaylar API/DB’den.
- **Placeholder metinler:** Sadece input placeholder; “fake” veri değil.
- **Eksik sayfa:** Yok; layout’taki tüm menü linkleri ilgili sayfaya gidiyor.
- **Teklif kabul → program bilgileri** ve **vize belgesi** akışları implemente.

Proje, veri ve akışlar açısından **production için hazır**. Canlıya almadan önce: env (NEXTAUTH_URL, DATABASE_URL, UPLOAD_DIR), DB migrate/seed ve dosya dizini yazma izinleri kontrol edilmeli.
