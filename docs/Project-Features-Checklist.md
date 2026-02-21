# Apply2Campus – Proje Özellik Listesi (Tam İnceleme)

Bu dosya projenin tüm sayfaları, rolleri ve seed verilerinin kontrol listesidir. Google OAuth maillerinin buna göre eksiksiz olduğu doğrulanmıştır.

---

## Roller (Prisma Role enum)

| Rol | Açıklama |
|-----|----------|
| ADMIN | Yönetici; tüm admin sayfaları, öğrenci/danışman yönetimi, OAuth’u öğrenci adına başlatabilir |
| CONSULTANT | Danışman; panel, kendi atanmış öğrencileri, müsait saatler, görevler, OAuth başlatabilir |
| OPERATION_UNIVERSITY | Üniversite operasyon; panel, operasyon inbox, görevler (müsait saat yok) |
| OPERATION_ACCOMMODATION | Konaklama operasyon; aynı |
| OPERATION_VISA | Vize operasyon; aynı |
| STUDENT | Öğrenci; sadece kendi dashboard’u |

---

## Seed’de oluşturulan kullanıcılar (prisma/seed.ts)

| Rol | E-posta | Şifre | Not |
|-----|---------|--------|-----|
| ADMIN | admin@educonsult.local | password123 | Admin Team |
| CONSULTANT | sarah@educonsult.local | password123 | Sarah Jenkins |
| STUDENT | alex.johnson@example.com | password123 | Alex Johnson (studentId: seed-student-1) |

Not: Operasyon rolleri (OPERATION_*) schema’da var ama seed’de bu rollerde kullanıcı oluşturulmuyor. Chen Wei (seed-student-2) sadece Student kaydı; giriş için User yok.

---

## Giriş sonrası yönlendirme (app/page.tsx + layout’lar)

- ADMIN → /admin  
- STUDENT → /dashboard  
- OPERATION_* → /operasyon/inbox  
- CONSULTANT → /panel  

---

## Öğrenci paneli (STUDENT) – /dashboard altı

| URL | Açıklama |
|-----|----------|
| /dashboard | Ana sayfa; Gmail bağlama kartı veya özet |
| /dashboard/profilim | Profilim (CRM formu) |
| /dashboard/basvurularim | Başvurularım |
| /dashboard/offers | Teklif listesi |
| /dashboard/offers/[offerId] | Teklif detay |
| /dashboard/dokumanlar | Dökümanlar |
| /dashboard/vize | Vize bilgileri |
| /dashboard/videolar | Eğitim videoları |
| /dashboard/settings | Ayarlar (Gmail bağlantısı + portal giriş bilgileri) |
| /dashboard/inbox | → redirect /dashboard |
| /dashboard/crm | → redirect /dashboard |

---

## Admin paneli (ADMIN) – /admin altı

| URL | Açıklama |
|-----|----------|
| /admin | Özet (istatistikler, danışman listesi) |
| /admin/danismanlar | Danışmanlar |
| /admin/ogrenciler | Öğrenciler |
| /admin/asamalar | Aşamalar |
| /admin/katalog | Katalog |
| /admin/kurumlar | Kurum kartları |
| /admin/duyurular | Duyurular |
| /admin/almanya | Almanya teklif kataloğu |

---

## Danışman paneli (CONSULTANT) – AppSidebar

| URL | Açıklama |
|-----|----------|
| /panel | Ana sayfa |
| /students | Öğrenci listesi |
| /panel/musait-saatler | Müsait saatler |
| /panel/gorevler | Görevler |
| /students/[studentId] | Öğrenci detay (sekme: Ana Sayfa, Profil, Belgeler, Vize, Başvurular, Teklifler, Gelen kutusu) |

---

## Operasyon paneli (OPERATION_*) – AppSidebar

| URL | Açıklama |
|-----|----------|
| /panel | Ana sayfa |
| /students | Öğrenci listesi |
| /operasyon/inbox | Tek Inbox |
| /operasyon/inbox/message/[id] | Mesaj detay |
| /panel/gorevler | Görevler |

Not: Müsait saatler sadece CONSULTANT/ADMIN’de görünür.

---

## Gmail OAuth

| Öğe | Değer |
|-----|--------|
| Start (öğrenci) | GET /api/oauth/gmail/start (oturumda studentId) |
| Start (staff) | GET /api/oauth/gmail/start?studentId=... |
| Callback | GET /api/oauth/gmail/callback |
| Scope’lar | gmail.readonly, gmail.send, gmail.modify, userinfo.email |

---

## Diğer sayfalar

| URL | Erişim |
|-----|--------|
| / | Giriş yoksa landing; giriş varsa role’e göre redirect |
| /login | Giriş sayfası |
| /register | Öğrenci kayıt |
| /gizlilik | Gizlilik politikası |
| /kullanim-kosullari | Kullanım koşulları |

---

## İki mailde olması gerekenler (Google OAuth doğrulaması)

- [x] Uygulama özeti (öğrenci + staff, Gmail kullanımı)  
- [x] Tüm test hesapları: Admin, Consultant, Student (e-posta + şifre)  
- [x] OAuth consent flow adımları (URL’ler, “Gmail ile Bağlan”)  
- [x] Staff tarafından OAuth başlatma (Students → öğrenci → Gmail bağlan)  
- [x] Her scope’un amacı ve nasıl test edileceği  
- [x] Redirect URI notu  
- [x] Giriş sonrası yönlendirme (Admin→/admin, Consultant→/panel, Student→/dashboard)  
- [x] Operasyon rolleri: Seed’de kullanıcı yok; mailde “Admin ve Consultant staff tarafı OAuth testini karşılar” notu (takip mailinde)

İlk mail (Google-OAuth-Email-PlainText.txt): Tabloda Admin dahil 3 hesap var.  
Takip maili (Google-OAuth-FollowUp-Email.txt): 3 hesap + redirect’ler + OAuth özeti. Operasyon notu eklenecek.
