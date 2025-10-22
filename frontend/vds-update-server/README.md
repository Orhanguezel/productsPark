# MenuBrowse Güncelleme Sunucusu

Bu dizin menubrowse.com domain'inde `/updates/` altında yayınlanmalıdır.

## 📁 Dizin Yapısı

```
menubrowse.com/updates/
├── manifest.json              # En son versiyon bilgisi
├── .htaccess                  # Güvenlik ayarları
├── README.md                  # Bu dosya
└── versions/
    └── 1.0.1/                # Her versiyon için klasör
        ├── info.json         # Versiyon detayları
        ├── migrations.sql    # Veritabanı değişiklikleri (erişime kapalı)
        ├── protected-tables.json
        └── changelog.md      # Opsiyonel
```

## 🚀 Kurulum Adımları

### 1. Dosyaları VDS'e Yükleyin

```bash
# SSH ile bağlanın
ssh menubrowse@menubrowse.com

# Dizin zaten var (siz yüklediniz):
# /home/menubrowse/htdocs/menubrowse.com/updates/

# Dosyalar yüklenmiş durumda
```

### 2. Apache/Nginx Ayarları

**Apache için** (zaten .htaccess var):
```apache
# .htaccess dosyası otomatik çalışacak
# Eğer çalışmazsa Apache config'de:
AllowOverride All
```

**Nginx için** (nginx.conf'a ekleyin):
```nginx
location /updates/ {
    # CORS ayarları
    add_header Access-Control-Allow-Origin "*";
    add_header Access-Control-Allow-Methods "GET, OPTIONS";
    
    # SQL dosyalarını engelle
    location ~ \.sql$ {
        deny all;
    }
    
    # JSON ve MD dosyalarına izin ver
    location ~ \.(json|md)$ {
        add_header Content-Type application/json;
    }
}
```

### 3. İzinleri Ayarlayın

```bash
# Dosya sahipliği (eğer gerekirse)
chown -R menubrowse:menubrowse /home/menubrowse/htdocs/menubrowse.com/updates

# İzinler
chmod 755 /home/menubrowse/htdocs/menubrowse.com/updates
chmod 644 /home/menubrowse/htdocs/menubrowse.com/updates/*.json
chmod 644 /home/menubrowse/htdocs/menubrowse.com/updates/.htaccess
chmod 600 /home/menubrowse/htdocs/menubrowse.com/updates/versions/*/migrations.sql
chmod 755 /home/menubrowse/htdocs/menubrowse.com/updates/versions
chmod 755 /home/menubrowse/htdocs/menubrowse.com/updates/versions/1.0.1
chmod 644 /home/menubrowse/htdocs/menubrowse.com/updates/versions/1.0.1/*.json
```

### 4. Test Edin

Tarayıcıdan şu URL'leri test edin:

- ✅ https://menubrowse.com/updates/manifest.json (Erişilebilir olmalı)
- ✅ https://menubrowse.com/updates/versions/1.0.1/info.json (Erişilebilir olmalı)
- ❌ https://menubrowse.com/updates/versions/1.0.1/migrations.sql (403 Forbidden olmalı)

### 5. Environment Variable Ekleyin

Lovable/Metahub projenize gidin ve şu environment variable'ı ekleyin:

```
UPDATE_SERVER_URL=https://menubrowse.com/updates
```

## 📝 Yeni Güncelleme Ekleme

Yeni bir güncelleme (örneğin 1.0.2) eklemek için:

1. Yeni versiyon klasörü oluşturun:
```bash
mkdir -p /home/menubrowse/htdocs/menubrowse.com/updates/versions/1.0.2
```

2. Dosyaları oluşturun:
   - `info.json` - Versiyon bilgileri
   - `migrations.sql` - Veritabanı değişiklikleri
   - `protected-tables.json` - Korunacak tablolar

3. `manifest.json` dosyasını güncelleyin:
```json
{
  "latestVersion": "1.0.2",
  "minimumVersion": "1.0.0",
  "releaseDate": "2025-01-20T10:00:00Z",
  "isCritical": false,
  "downloadUrl": "https://menubrowse.com/updates/versions/1.0.2/",
  "checksum": "sha256:yeni_checksum"
}
```

## 🧪 Test Güncellemesi (1.0.1)

Bu klasördeki 1.0.1 versiyonu test amaçlıdır ve şunları yapar:

- ✅ Ana sayfadaki "Nasıl Çalışır?" başlığını "Nasıl Çalışır? TEST" olarak değiştirir
- ✅ Tüm kullanıcı verilerini korur
- ✅ Rollback (geri alma) desteği sağlar

### Test Adımları:

1. Admin paneline girin: `/admin/updates`
2. "Güncelleme Kontrolü Yap" butonuna tıklayın
3. Güncelleme bilgilerini inceleyin
4. "Güncellemeyi Uygula" butonuna tıklayın
5. Ana sayfaya gidip "Nasıl Çalışır?" bölümüne bakın
6. Başlık "Nasıl Çalışır? TEST" olarak görünmelidir

## 🔒 Güvenlik Notları

- ✅ SQL dosyaları HTTP erişimine kapalı (.htaccess ile)
- ✅ Sadece JSON ve MD dosyaları public
- ✅ CORS sadece GET request'lerine açık
- ✅ Admin rolü olmayan kullanıcılar güncelleme yapamaz
- ✅ Her güncelleme öncesi otomatik snapshot alınır

## 🆘 Sorun Giderme

### Güncelleme Sunucusuna Ulaşılamıyor

1. URL'yi kontrol edin: `https://menubrowse.com/updates/manifest.json`
2. CORS ayarlarını kontrol edin
3. Apache/Nginx loglarına bakın

### 403 Forbidden Hatası

1. Dosya izinlerini kontrol edin
2. .htaccess çalışıyor mu kontrol edin
3. Apache'de `AllowOverride All` olmalı

### Güncelleme Başarısız

1. `/admin/updates` sayfasında hata mesajına bakın
2. Metahub Edge Function loglarını kontrol edin
3. Migration SQL'ini manuel test edin

## 📞 Destek

Sorun yaşarsanız:
1. Edge Function loglarını kontrol edin
2. VDS sunucu loglarını kontrol edin
3. Migration'ların doğru formatta olduğundan emin olun