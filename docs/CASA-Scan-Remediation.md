# CASA Tarama Raporu – Düzeltme Rehberi

Bu dokümanda TAC Security CASA raporundaki maddeler için yapılacaklar özetlenir.

---

## 1. Proxy / Sunucu Bilgi Sızıntısı (Low) – CWE 204

**Sorun:** TRACE/OPTIONS/TRACK ile nginx ve Next.js sürümü tespit ediliyor; `Server`, `X-Powered-By` bilgisi sızıyor.

**Yapılacaklar (sunucu / nginx):**

- **TRACE ve TRACK’i kapatın.** OPTIONS CORS için gerekebilir; sadece TRACE/TRACK’i engelleyin.
- **Server header’ı gizleyin** (nginx sürümü görünmesin).
- **X-Powered-By:** Nginx’te `proxy_hide_header X-Powered-By;` ile backend’den gelen header’ı istemciye göndermeyin.
- **Özel hata sayfaları** kullanın (4xx/5xx) böylece varsayılan nginx/Next.js hata sayfaları sızmasın.

**Örnek nginx konfigürasyonu** (site `server` bloğuna eklenebilir):

```nginx
# Sürüm bilgisini kapat
server_tokens off;

# TRACE ve TRACK metodlarını reddet
if ($request_method ~ ^(TRACE|TRACK)$) {
    return 405;
}

# İsteğe bağlı: X-Powered-By'ı kaldır (proxy'de backend'den gelen header'ı silmek için)
proxy_hide_header X-Powered-By;
# NOT: Server header'ını tamamen kaldırmak için ngx_headers_more gerekir.
# server_tokens off; sürüm numarasını gizler (Server: nginx kalır).
```

**Tam örnek:** `docs/nginx-casa.conf` dosyasına bakın.

---

## 2. Sub Resource Integrity (SRI) Eksik (Low) – CWE 345

**Durum – Kapatıldı:** Artık hiçbir script veya stylesheet harici sunucudan (CDN) yüklenmiyor.

- **Material Icons Outlined:** `@fontsource/material-icons-outlined` ile self-host; `app/globals.css` içinde `@import` ile bundle’a dahil.
- **Lexend:** `@fontsource/lexend` ile self-host; `app/globals.css` içinde latin 300–700 ağırlıkları `@import` ile bundle’a dahil.
- **layout.tsx:** Google Fonts / harici `<link>` yok; `<head />` boş (fontlar CSS import ile geliyor).

Rescan’da sayfada `fonts.googleapis.com` linki görünmemeli; SRI bulgusu kapanır.

---

## 3. Cross-Origin-Resource-Policy (Info) – CWE 693

**Durum:** `next.config.js` içinde tüm sayfalar için `Cross-Origin-Resource-Policy: same-origin` header’ı eklendi. Deploy sonrası yanıtlarda bu header’ın geldiğini doğrulayın.

---

## 4. Server / X-Powered-By Sürüm Sızıntısı (Info) – CWE 497

**Durum:**

- Uygulama: Next.js varsayılan X-Powered-By’ı kaldırmak için nginx’te `proxy_hide_header X-Powered-By;` kullanın.
- Sunucu: `server_tokens off;` ve `proxy_hide_header X-Powered-By;` (yukarıdaki nginx örneği ve `docs/nginx-casa.conf`).

---

## 5. Strict-Transport-Security (HSTS) (Info) – CWE 319

**Durum:** `next.config.js` headers’a `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` eklendi. Production’da HTTPS kullandığınızdan emin olun.

**İsteğe bağlı:** [HSTS Preload](https://hstspreload.org/) listesine eklenmek için aynı header yeterli; siteyı listeye gönderebilirsiniz.

---

## 6. Information Disclosure – Suspicious Comments (Info) – CWE 615

**Durum:** Rapor, Next.js ve core-js gibi üçüncü parti minify edilmiş JS içindeki “query”, “select”, “from” gibi kelimeleri “şüpheli yorum” olarak işaretliyor. Bunlar framework/kütüphane kodunda; uygulama kaynak kodunuzda değil.

**Yapılacak:** TAC’a **False Positive** olarak bildirin: “Findings are inside Next.js and core-js bundled/minified code, not application source; we do not control third-party bundle content.”

---

## 7. Modern Web Application (Info)

Bilgilendirme amaçlı; aksiyon gerekmez.

---

## 8. Storable and Cacheable Content / Cache-Control (Info) – CWE 524, 525

**Durum:** `next.config.js` içinde hassas sayfalar için ayrı header kuralları eklendi:

- `Cache-Control: no-store, no-cache, must-revalidate, private`
- `Pragma: no-cache`
- `Expires: 0`

Kapsanan yollar: `/login`, `/register`, `/dashboard`, `/admin`, `/students`, `/operasyon`, `/gizlilik`, `/kullanim-kosullari` (ve alt path’leri).

Static asset’ler (`/_next/static/...`) için uzun `max-age` kalabilir; sadece kullanıcıya özel/hassas sayfalar no-store ile işaretlendi.

---

## Özet Kontrol Listesi

| # | Madde                         | Uygulama (Next.js)     | Sunucu (nginx)                    |
|---|-------------------------------|------------------------|-----------------------------------|
| 1 | Proxy/server disclosure       | -                      | TRACE/TRACK kapat, server_tokens off, proxy_hide_header |
| 2 | SRI                           | Tüm fontlar self-host (Lexend + Material Icons) | Harici link yok |
| 3 | CORP                          | same-origin eklendi    | -                                 |
| 4 | Server/X-Powered-By           | -                     | server_tokens off, proxy_hide_header X-Powered-By |
| 5 | HSTS                          | Header eklendi         | -                                 |
| 6 | Suspicious comments           | -                      | TAC’a false positive bildirimi   |
| 7 | Modern web app                | -                      | -                                 |
| 8 | Cache-Control                 | Hassas sayfalar no-store| -                                 |

Deploy sonrası bir sonraki CASA revalidation’da bu maddelerin “resolved” sayılması için gerekirse TAC’a düzeltme kanıtı (ör. ekran görüntüsü veya curl çıktısı) ile birlikte bildirim yapın.

---

## TAC Raporda “Open” Kalan Maddeler – Özet

| # | Madde | Aksiyon |
|---|--------|--------|
| **1** Proxy Disclosure | Nginx: `server_tokens off;`, TRACE/TRACK reddi, `proxy_hide_header X-Powered-By;` uygula. `docs/nginx-casa.conf` kullan. |
| **2** SRI Missing | **Uygulama tarafında kapatıldı.** Lexend + Material Icons self-host; harici font linki yok. Yeni deploy + rescan sonrası kapanır. |
| **6** COOP Missing | `next.config.js` içinde zaten `Cross-Origin-Opener-Policy: same-origin` var. Nginx header’ı silmiyorsa rescan’da görünür. |
| **7** Suspicious Comments | **False positive.** “query”, “select”, “from” minify edilmiş Next.js/core-js kodunda; uygulama kaynak kodu değil. TAC’a: “Findings in third-party bundled code; no application comments.” |
| **8** Modern Web Application | **Bilgilendirme.** “No changes required.” TAC dokümanında yazıyor. |
| **9** Storable and Cacheable | Hassas sayfalar `no-store` ile işaretli. Statik chunk’lar için `max-age` normal. Gerekirse TAC’a: “Sensitive routes use no-store; static assets are versioned.” |
