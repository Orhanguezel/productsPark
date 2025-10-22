# 🚀 MenuBrowse VDS Kurulum Rehberi

## Hızlı Kurulum (3 Adım)

### 1️⃣ Dosyaları VDS'e Yükle

#### Yöntem A: SFTP ile (Önerilen)
```bash
# FileZilla, WinSCP veya Cyberduck kullanarak:
# Yerel Dizin: Bu klasör (vds-update-server)
# Uzak Dizin: /home/menubrowse/htdocs/menubrowse.com/updates/

# Tüm dosyaları yükleyin (dizin yapısını koruyun)
# ✅ SİZ ZATEN YÜKLEDİNİZ!
```

#### Yöntem B: SSH ile
```bash
# 1. Bu klasörü zip'leyin
cd vds-update-server
zip -r updates.zip .

# 2. VDS'e yükleyin
scp updates.zip menubrowse@menubrowse.com:/tmp/

# 3. VDS'te unzip edin
ssh menubrowse@menubrowse.com
cd /home/menubrowse/htdocs/menubrowse.com
unzip /tmp/updates.zip -d updates/
```

### 2️⃣ İzinleri Ayarla

```bash
# SSH ile bağlanın
ssh menubrowse@menubrowse.com

# Doğru dizine gidin
cd /home/menubrowse/htdocs/menubrowse.com/updates

# İzinleri ayarlayın
find . -type d -exec chmod 755 {} \;
find . -type f -exec chmod 644 {} \;
chmod 600 versions/*/migrations.sql

# Sahiplik zaten doğru (menubrowse kullanıcısı)
# Eğer gerekirse:
# chown -R menubrowse:menubrowse .
```

### 3️⃣ Environment Variable Ekle

Lovable projenizde:
1. Settings → Environment Variables
2. Yeni variable ekle:
   ```
   Key: UPDATE_SERVER_URL
   Value: https://menubrowse.com/updates
   ```
3. Deploy edin

## ✅ Test Et

### 1. Manuel Test (Tarayıcıdan)

URL'leri tarayıcıda açın:

✅ **BAŞARILI olmalı:**
- https://menubrowse.com/updates/manifest.json
- https://menubrowse.com/updates/versions/1.0.1/info.json

❌ **BAŞARISIZ olmalı (403 Forbidden):**
- https://menubrowse.com/updates/versions/1.0.1/migrations.sql

### 2. Uygulama Testi

1. Admin paneline girin: `https://yourapp.lovable.app/admin/updates`
2. "Güncelleme Kontrolü Yap" butonuna tıklayın
3. Güncelleme bilgilerini görmelisiniz:
   ```
   Yeni Güncelleme Mevcut!
   Versiyon 1.0.1
   Test Güncellemesi
   ```
4. "Güncellemeyi Uygula" butonuna tıklayın
5. Ana sayfaya gidip "Nasıl Çalışır?" başlığına bakın
6. Başlık "Nasıl Çalışır? TEST" olmalı ✅

## 🔧 Web Sunucu Konfigürasyonu

### Apache (.htaccess zaten var)

`.htaccess` dosyası otomatik çalışır. Eğer çalışmazsa:

```apache
# httpd.conf veya vhost config dosyanızda:
<Directory "/home/menubrowse/htdocs/menubrowse.com/updates">
    AllowOverride All
    Require all granted
</Directory>
```

Apache'yi restart edin:
```bash
sudo systemctl restart apache2
```

### Nginx (Eğer Nginx kullanıyorsanız)

`/etc/nginx/sites-available/menubrowse.com` veya `/etc/nginx/conf.d/menubrowse.com.conf` dosyasına ekleyin:

```nginx
server {
    server_name menubrowse.com www.menubrowse.com;
    
    root /home/menubrowse/htdocs/menubrowse.com;

    # Güncelleme sunucusu
    location /updates/ {
        # CORS
        add_header Access-Control-Allow-Origin "*";
        add_header Access-Control-Allow-Methods "GET, OPTIONS";
        add_header Access-Control-Allow-Headers "authorization, x-client-info, apikey, content-type";
        
        # SQL dosyalarını engelle
        location ~ \.sql$ {
            deny all;
            return 403;
        }
        
        # JSON ve MD dosyalarına izin ver
        location ~ \.(json|md)$ {
            add_header Content-Type application/json;
            try_files $uri =404;
        }
    }
}
```

Nginx'i test ve restart edin:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🐛 Sorun Giderme

### "Güncelleme sunucusuna ulaşılamıyor" Hatası

**Kontrol Listesi:**
1. ✅ Dosyalar doğru dizinde mi? `/home/menubrowse/htdocs/menubrowse.com/updates/`
2. ✅ manifest.json tarayıcıda açılıyor mu?
3. ✅ CORS ayarları doğru mu?
4. ✅ UPDATE_SERVER_URL environment variable doğru mu?

**Log Kontrolü:**
```bash
# Apache logs
tail -f /var/log/apache2/error.log
tail -f /var/log/apache2/access.log

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

### "403 Forbidden" Hatası

**Dosya İzinleri:**
```bash
# İzinleri kontrol et
ls -la /home/menubrowse/htdocs/menubrowse.com/updates/

# Düzelt
chmod 755 /home/menubrowse/htdocs/menubrowse.com/updates
chmod 644 /home/menubrowse/htdocs/menubrowse.com/updates/*.json
```

**Apache AllowOverride:**
```bash
# Kontrol et
grep -r "AllowOverride" /etc/apache2/

# Eğer "AllowOverride None" görüyorsanız "AllowOverride All" yapın
```

### Güncelleme Uygulanmıyor

**Edge Function Loglarını Kontrol:**
1. Lovable'da projeyi açın
2. Backend → Functions → apply-update
3. Logs sekmesine bakın
4. Hata mesajını görün

**Migration Test:**
```sql
-- Metahub SQL Editor'da manuel test
UPDATE site_settings 
SET value = '"Nasıl Çalışır? TEST"'::jsonb
WHERE key = 'home_how_it_works_title';
```

## 📝 Yeni Versiyon Ekleme

### Örnek: 1.0.2 Versiyonu

1. **Yeni Klasör Oluştur:**
```bash
mkdir -p /home/menubrowse/htdocs/menubrowse.com/updates/versions/1.0.2
```

2. **Dosyaları Oluştur:**

`versions/1.0.2/info.json`:
```json
{
  "version": "1.0.2",
  "releaseDate": "2025-01-20T10:00:00Z",
  "requiredVersion": "1.0.0",
  "isCritical": false,
  "changelog": {
    "tr": "## v1.0.2 Güncellemesi\n- Yeni özellikler eklendi"
  },
  "estimatedTime": "2-3 dakika"
}
```

`versions/1.0.2/migrations.sql`:
```sql
-- Yeni özelliklerinizi buraya ekleyin
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS new_feature TEXT DEFAULT 'default';
```

3. **manifest.json Güncelle:**
```json
{
  "latestVersion": "1.0.2",
  "minimumVersion": "1.0.0",
  "releaseDate": "2025-01-20T10:00:00Z",
  "isCritical": false,
  "downloadUrl": "https://menubrowse.com/updates/versions/1.0.2/",
  "checksum": "sha256:yeni_hash"
}
```

## 🎉 Tamamlandı!

Kurulum tamamlandı! Artık:
- ✅ Güncelleme sunucusu çalışıyor
- ✅ Admin panelden güncelleme yapabilirsiniz
- ✅ Otomatik yedekleme ve rollback desteği var
- ✅ Kullanıcı ayarları korunuyor

Test güncellemesini uygulayarak sistemin çalıştığını doğrulayın!