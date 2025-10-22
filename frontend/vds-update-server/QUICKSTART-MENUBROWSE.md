# 🚀 MenuBrowse.com İçin Hızlı Başlangıç

## 1️⃣ VDS'e Dosyaları Yükle (2 dakika)

### FileZilla/WinSCP ile:
```
✅ SİZ ZATEN YÜKLEDİNİZ!
Yerel Klasör: vds-update-server/
↓ Yüklendi ↓
VDS Klasör: /home/menubrowse/htdocs/menubrowse.com/updates/
```

**Dizin yapısı şöyle olmalı:**
```
/home/menubrowse/htdocs/menubrowse.com/
└── updates/
    ├── manifest.json
    ├── .htaccess
    ├── README.md
    └── versions/
        └── 1.0.1/
            ├── info.json
            ├── migrations.sql
            └── protected-tables.json
```

## 2️⃣ İzinleri Ayarla (1 dakika)

SSH'ye bağlan ve çalıştır:

```bash
cd /home/menubrowse/htdocs/menubrowse.com/updates
chmod 755 .
chmod 644 *.json .htaccess
chmod 755 versions
chmod 755 versions/1.0.1
chmod 644 versions/1.0.1/*.json
chmod 600 versions/1.0.1/migrations.sql
```

## 3️⃣ Test Et (30 saniye)

Tarayıcıda aç:

✅ https://menubrowse.com/updates/manifest.json
```json
{
  "latestVersion": "1.0.1",
  ...
}
```

✅ https://menubrowse.com/updates/versions/1.0.1/info.json
```json
{
  "version": "1.0.1",
  ...
}
```

❌ https://menubrowse.com/updates/versions/1.0.1/migrations.sql
```
403 Forbidden (Bu doğru!)
```

## 4️⃣ Environment Variable Ekle

Lovable/Metahub projenizde:

```
UPDATE_SERVER_URL=https://menubrowse.com/updates
```

## 5️⃣ Test Güncellemesini Uygula! 🎉

1. Admin paneline git: `/admin/updates`
2. "Güncelleme Kontrolü Yap" tıkla
3. Versiyon 1.0.1 göreceksin
4. "Güncellemeyi Uygula" tıkla
5. Ana sayfaya git
6. "Nasıl Çalışır?" başlığı artık "Nasıl Çalışır? TEST" ✅

---

## ❓ Sorun mu Var?

### manifest.json açılmıyor?
```bash
# İzinleri kontrol et
ls -la /home/menubrowse/htdocs/menubrowse.com/updates/manifest.json

# Düzelt
chmod 644 /home/menubrowse/htdocs/menubrowse.com/updates/manifest.json
```

### Admin panelde "Güncelleme sunucusuna ulaşılamıyor"?
1. UPDATE_SERVER_URL doğru mu kontrol et
2. CORS ayarları için .htaccess çalışıyor mu kontrol et
3. Apache restart: `sudo systemctl restart apache2`

### Daha fazla yardım?
- README.md - Detaylı açıklamalar
- INSTALLATION.md - Adım adım kurulum
- TROUBLESHOOTING.md - Sorun giderme

---

**Tebrikler! Güncelleme sistemi hazır! 🎊**