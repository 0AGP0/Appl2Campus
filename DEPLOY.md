# Sunucu deploy – veri koruma

**Kural: Projeyi güncellediğinde (git pull + build + restart) sunucudaki hiçbir veri otomatik olarak değişmez veya silinmez.** Aksi açıkça belirtilmedikçe bu böyledir.

## Production checklist (Duyuru, Kurum, Slot, Görev ekleme çalışmıyorsa)

Sunucuda ekleme işlemleri başarısız oluyorsa şunları kontrol edin:

1. **NEXTAUTH_URL** – Production ortamında tam URL olmalı: `https://your-domain.com` (http değil, sonunda `/` yok)
2. **NEXTAUTH_SECRET** – Sunucuda tanımlı ve en az 32 karakter
3. **HTTPS** – Session cookie `Secure` ile set edilir; yalnızca HTTPS üzerinden gönderilir. Proxy arkasındaysanız X-Forwarded-Proto: https olmalı
4. **Cookie domain** – NEXTAUTH_URL ile aynı domain kullanılmalı
5. **Rate limiting (isteğe bağlı):** Çoklu instance veya DDoS koruması için [Upstash Redis](https://console.upstash.com/) kullanılabilir. `.env` içinde `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` tanımlanırsa: global API limiti (100 istek/dakika/IP) ve kayıt/giriş/sync limitleri Redis üzerinden uygulanır.

## Standart güncelleme (veriye dokunulmaz)

```bash
cd /var/www/apply2campus
git fetch origin
git reset --hard origin/master
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
pm2 restart apply2campus
```

- **prisma migrate deploy** yalnızca henüz uygulanmamış migration’ları çalıştırır (yeni tablo/kolon ekler). Mevcut kayıtları silmez veya sıfırlamaz.
- **Seed hiçbir zaman otomatik çalışmaz.** Sadece siz elle çalıştırırsanız çalışır.

## Veriyi silen / sıfırlayan komutlar (production’da kullanmayın)

- `prisma migrate reset` – Veritabanını siler, migration’ları baştan uygular.
- `prisma db push --force-reset` – Şemayı zorlar; reset ile veri silinebilir.
