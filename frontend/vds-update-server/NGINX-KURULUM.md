# 🚀 Nginx Kurulum Rehberi - MenuBrowse.com

## ⚠️ ÖNEMLİ: Dosya Konumu

Dosyalar şu anda yanlış dizinde:
```
❌ /home/menubrowse/htdocs/menubrowse.com/updates/vds-update-server/
```

Doğru konum:
```
✅ /home/menubrowse/htdocs/menubrowse.com/updates/
```

## 1️⃣ Dosyaları Doğru Konuma Taşıyın

SSH ile bağlanın ve şu komutları çalıştırın:

```bash
# Mevcut dizine gidin
cd /home/menubrowse/htdocs/menubrowse.com/updates

# vds-update-server içindekileri bir üst dizine taşıyın
mv vds-update-server/* .
mv vds-update-server/.htaccess . 2>/dev/null || true

# Boş klasörü silin
rmdir vds-update-server

# Kontrol edin - şu dosyalar görünmeli:
ls -la
# manifest.json, README.md, versions/ klasörü burada olmalı
```

Sonuç olarak dizin yapınız şöyle olmalı:
```
/home/menubrowse/htdocs/menubrowse.com/updates/
├── manifest.json
├── README.md
├── NGINX-KURULUM.md
└── versions/
    └── 1.0.1/
        ├── info.json
        ├── migrations.sql
        └── protected-tables.json
```

## 2️⃣ Nginx Konfigürasyonu

Nginx config dosyanızı düzenleyin (genellikle `/etc/nginx/sites-available/menubrowse.com` veya `/etc/nginx/conf.d/menubrowse.com.conf`):

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name menubrowse.com www.menubrowse.com;
    
    # Ana site dizini
    root /home/menubrowse/htdocs/menubrowse.com;
    index index.html index.htm index.php;

    # Güncelleme sunucusu için özel ayarlar
    location /updates/ {
        # Ana dizin
        alias /home/menubrowse/htdocs/menubrowse.com/updates/;
        
        # CORS ayarları
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
        add_header Access-Control-Allow-Headers "authorization, x-client-info, apikey, content-type" always;
        
        # OPTIONS request için
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

    # Ana site için diğer ayarlarınız...
    location / {
        try_files $uri $uri/ =404;
    }
}
```

### Nginx'i Test ve Restart Edin

```bash
# Konfigürasyonu test et
sudo nginx -t

# Başarılıysa restart et
sudo systemctl restart nginx

# Durumu kontrol et
sudo systemctl status nginx
```

## 3️⃣ Dosya İzinlerini Ayarlayın

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

## 4️⃣ Test Edin

Tarayıcıdan şu URL'leri test edin:

### ✅ Başarılı Olması Gerekenler:

**manifest.json:**
```
https://menubrowse.com/updates/manifest.json
```
Şunu görmeli:
```json
{
  "latestVersion": "1.0.1",
  "minimumVersion": "1.0.0",
  ...
}
```

**info.json:**
```
https://menubrowse.com/updates/versions/1.0.1/info.json
```
Şunu görmeli:
```json
{
  "version": "1.0.1",
  "releaseDate": "2025-01-15T10:00:00Z",
  ...
}
```

### ❌ Başarısız Olması Gereken (403 Forbidden):

**migrations.sql:**
```
https://menubrowse.com/updates/versions/1.0.1/migrations.sql
```
"403 Forbidden" hatası görmeli (Bu doğru!)

## 5️⃣ Environment Variable Ekleyin

Lovable/Metahub projenizde:

1. Settings → Environment Variables
2. Ekle:
```
Key: UPDATE_SERVER_URL
Value: https://menubrowse.com/updates
```
3. Save → Deploy

## 6️⃣ Uygulama Testi

1. Admin paneline git: `/admin/updates`
2. "Güncelleme Kontrolü Yap" tıkla
3. Güncelleme bilgilerini gör:
   ```
   Yeni Güncelleme Mevcut!
   Versiyon 1.0.1
   Test Güncellemesi
   ```
4. "Güncellemeyi Uygula" tıkla
5. Ana sayfaya git
6. "Nasıl Çalışır?" başlığı artık "Nasıl Çalışır? TEST" ✅

## 🐛 Sorun Giderme

### manifest.json Açılmıyor (404)

```bash
# Dosya var mı kontrol et
ls -la /home/menubrowse/htdocs/menubrowse.com/updates/manifest.json

# Yoksa yanlış dizindesiniz, dosyaları taşıyın
cd /home/menubrowse/htdocs/menubrowse.com/updates
mv vds-update-server/* .
```

### 403 Forbidden Hatası (JSON dosyaları için)

```bash
# İzinleri kontrol et
ls -la /home/menubrowse/htdocs/menubrowse.com/updates/

# Düzelt
chmod 644 /home/menubrowse/htdocs/menubrowse.com/updates/manifest.json
```

### CORS Hatası

```bash
# Nginx config'i kontrol et
sudo nginx -t

# Log'ları kontrol et
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Nginx Başlamıyor

```bash
# Syntax hatası var mı kontrol et
sudo nginx -t

# Detaylı log
sudo journalctl -u nginx -n 50
```

## 📝 Yeni Versiyon Ekleme

Örnek: 1.0.2 versiyonu eklemek için:

```bash
# Yeni versiyon klasörü oluştur
mkdir -p /home/menubrowse/htdocs/menubrowse.com/updates/versions/1.0.2

# Dosyaları oluştur (info.json, migrations.sql, protected-tables.json)
# ...

# manifest.json güncelle
nano /home/menubrowse/htdocs/menubrowse.com/updates/manifest.json

# İzinleri ayarla
chmod 755 versions/1.0.2
chmod 644 versions/1.0.2/info.json
chmod 644 versions/1.0.2/protected-tables.json
chmod 600 versions/1.0.2/migrations.sql
```

## ✅ Tamamlandı!

Artık güncelleme sisteminiz Nginx ile çalışıyor! 🎉

Test güncellemesini uygulayarak sistemin çalıştığını doğrulayın.
