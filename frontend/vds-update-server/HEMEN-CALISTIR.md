# ⚡ HEMEN ÇALIŞTIR - MenuBrowse.com (Nginx)

## ⚠️ ÖNEMLİ: Dosya Konumu Yanlış!

Dosyalar şu anda:
```
❌ /home/menubrowse/htdocs/menubrowse.com/updates/vds-update-server/
```

Olması gereken:
```
✅ /home/menubrowse/htdocs/menubrowse.com/updates/
```

## 🔧 Şimdi Yapılacaklar (5 Dakika)

### 1. SSH'ye Bağlan
```bash
ssh menubrowse@menubrowse.com
```

### 2. Dosyaları Doğru Konuma Taşı (Kopyala-Yapıştır)
```bash
cd /home/menubrowse/htdocs/menubrowse.com/updates

# vds-update-server içindekileri bir üst dizine taşı
mv vds-update-server/* .
mv vds-update-server/.htaccess . 2>/dev/null || true

# Boş klasörü sil
rmdir vds-update-server

# Kontrol et - manifest.json burada olmalı
ls -la
```

### 3. Nginx Konfigürasyonu Ekle

`/etc/nginx/sites-available/menubrowse.com` veya `/etc/nginx/conf.d/menubrowse.com.conf` dosyasını düzenle:

```nginx
# Mevcut server bloğunun içine ekle:

    # Güncelleme sunucusu
    location /updates/ {
        alias /home/menubrowse/htdocs/menubrowse.com/updates/;
        
        # CORS
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "authorization, x-client-info, apikey, content-type" always;
        
        if ($request_method = 'OPTIONS') {
            return 204;
        }
        
        # SQL dosyalarını engelle
        location ~ \.sql$ {
            deny all;
            return 403;
        }
        
        # JSON ve MD dosyalarına izin ver
        location ~ \.(json|md)$ {
            add_header Content-Type "application/json; charset=utf-8" always;
            try_files $uri =404;
        }
    }
```

Nginx'i test ve restart et:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 4. İzinleri Ayarla (Kopyala-Yapıştır)
```bash
cd /home/menubrowse/htdocs/menubrowse.com/updates

# Klasör izinleri
chmod 755 .
chmod 755 versions
chmod 755 versions/1.0.1

# Dosya izinleri
chmod 644 manifest.json
chmod 644 *.md
chmod 644 versions/1.0.1/info.json
chmod 644 versions/1.0.1/protected-tables.json

# SQL dosyasını gizle (önemli!)
chmod 600 versions/1.0.1/migrations.sql

# Kontrol et
ls -la
ls -la versions/1.0.1/
```

### 3. Test Et (Tarayıcıdan)

Şu URL'leri aç:

✅ https://menubrowse.com/updates/manifest.json
```json
{
  "latestVersion": "1.0.1",
  "minimumVersion": "1.0.0",
  ...
}
```
**Görmüyorsan → .htaccess çalışmıyor olabilir**

✅ https://menubrowse.com/updates/versions/1.0.1/info.json
```json
{
  "version": "1.0.1",
  ...
}
```

❌ https://menubrowse.com/updates/versions/1.0.1/migrations.sql
```
403 Forbidden
```
**Bu doğru! SQL dosyası gizli olmalı.**

### 6. Environment Variable Ekle

Lovable/Metahub projesinde:

1. Settings → Environment Variables
2. Ekle:
```
Key: UPDATE_SERVER_URL
Value: https://menubrowse.com/updates
```
3. Save → Deploy

### 5. Uygulama Testi! 🎉

1. Admin paneline git: `https://yourapp.lovable.app/admin/updates`
2. "Güncelleme Kontrolü Yap" tıkla
3. Şunu göreceksin:
   ```
   Yeni Güncelleme Mevcut!
   Versiyon 1.0.1
   Test Güncellemesi
   ```
4. "Güncellemeyi Uygula" tıkla
5. Ana sayfaya git
6. "Nasıl Çalışır?" başlığına bak
7. Artık "Nasıl Çalışır? TEST" yazıyor! ✅

---

## 🐛 Hata Alıyorsan?

### manifest.json açılmıyor (404)
```bash
# Dizini kontrol et
cd /home/menubrowse/htdocs/menubrowse.com/updates
pwd
ls -la

# Dosya var mı?
cat manifest.json
```

### manifest.json açılıyor ama boş (403)
```bash
# İzinleri kontrol et
ls -la manifest.json

# İzni değiştir
chmod 644 manifest.json
```

### .htaccess çalışmıyor
```bash
# Apache config kontrol
grep -r "AllowOverride" /etc/apache2/

# Eğer "AllowOverride None" yazıyorsa:
# vhost config dosyasını bul ve "AllowOverride All" yap
```

### "Güncelleme sunucusuna ulaşılamıyor"
1. UPDATE_SERVER_URL doğru mu? `https://menubrowse.com/updates`
2. CORS çalışıyor mu? manifest.json tarayıcıda açılıyor mu?
3. Apache restart dene: `sudo systemctl restart apache2`

### Hala Sorun Var?
```bash
# Nginx error log'a bak
sudo tail -f /var/log/nginx/error.log

# Access log'a bak
sudo tail -f /var/log/nginx/access.log

# İzinleri tekrar kontrol
ls -laR /home/menubrowse/htdocs/menubrowse.com/updates/

# Nginx config test
sudo nginx -t
```

---

## 📞 İletişim

Sorularınız için:
- README.md - Detaylı dokümantasyon
- INSTALLATION.md - Adım adım kurulum
- TROUBLESHOOTING.md - Sorun giderme

**Başarılar! 🚀**