-- =============================================================
-- FILE: 60.6_site_settings_theme_colors.seed.sql
-- Theme Settings - Dinamik tema yonetimi (GENISLETILMIS)
-- Renkler, Font, Border Radius, Shadow, Arka Plan, Animasyon vb.
-- - Upsert by unique key (site_settings.key)
-- - HSL format: "hue saturation% lightness%" (e.g., "142 76% 36%")
--
-- PRESET COLORS:
-- Green:  142 76% 36% (default)
-- Blue:   221 83% 53%
-- Purple: 262 83% 58%
-- Orange: 25 95% 53%
-- Red:    0 84% 60%
-- Cyan:   190 90% 50%
-- Teal:   168 76% 42%
-- Pink:   330 81% 60%
--
-- PRESET FONTS:
-- inter, poppins, roboto, nunito, montserrat, openSans, lato, sourceSans
--
-- PRESET RADIUS:
-- none, sm, md, lg (default), xl, 2xl, full
--
-- PRESET SHADOWS:
-- none, soft, normal (default), strong, dramatic
--
-- PRESET BACKGROUND TONES:
-- neutral (default), warm, cool, slate
--
-- PRESET CARD STYLES:
-- default, glass, flat, elevated
--
-- PRESET BORDER STYLES:
-- none, subtle, normal (default), strong
--
-- PRESET FONT WEIGHTS:
-- light, normal (default), medium, semibold
--
-- PRESET LETTER SPACING:
-- tight, normal (default), wide
--
-- PRESET ANIMATION SPEEDS:
-- none, fast, normal (default), slow
--
-- PRESET CHART PALETTES:
-- default, warm, cool, monochrome
-- =============================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

INSERT INTO `site_settings` (`id`, `key`, `value`, `created_at`, `updated_at`) VALUES

-- ==================================================================
-- THEME ENABLED
-- Dinamik tema ayarlarini aktif/pasif yapmak icin
-- ==================================================================
('tc07a1b2-c3d4-e5f6-a7b8-c9d0e1f2a007', 'theme_colors_enabled', 'true', NOW(3), NOW(3)),

-- ==================================================================
-- RENK AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- THEME COLOR MODE
-- Preset renk veya custom renk secimi
-- Degerler: green, blue, purple, orange, red, cyan, teal, pink, custom
-- ------------------------------------------------------------------
('tc01a1b2-c3d4-e5f6-a7b8-c9d0e1f2a001', 'theme_color_preset', 'green', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- PRIMARY COLOR (Ana Renk)
-- Butonlar, linkler, vurgular icin kullanilir
-- HSL format: "hue saturation% lightness%"
-- ------------------------------------------------------------------
('tc02a1b2-c3d4-e5f6-a7b8-c9d0e1f2a002', 'theme_primary_hsl', '142 76% 36%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- PRIMARY GLOW (Parlak versiyon)
-- Hover efektleri ve gradientler icin
-- ------------------------------------------------------------------
('tc03a1b2-c3d4-e5f6-a7b8-c9d0e1f2a003', 'theme_primary_glow_hsl', '142 71% 45%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- ACCENT COLOR (Vurgu Rengi)
-- Genellikle primary ile ayni, ama farkli olabilir
-- ------------------------------------------------------------------
('tc04a1b2-c3d4-e5f6-a7b8-c9d0e1f2a004', 'theme_accent_hsl', '142 76% 36%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- SUCCESS COLOR (Basari Rengi)
-- Onay mesajlari, basarili islemler icin
-- ------------------------------------------------------------------
('tc05a1b2-c3d4-e5f6-a7b8-c9d0e1f2a005', 'theme_success_hsl', '142 76% 36%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- DESTRUCTIVE/ERROR COLOR (Hata Rengi)
-- Hata mesajlari, silme butonlari icin
-- ------------------------------------------------------------------
('tc06a1b2-c3d4-e5f6-a7b8-c9d0e1f2a006', 'theme_destructive_hsl', '0 84% 60%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- SECONDARY COLOR (Ikincil Renk)
-- Secondary butonlar ve arka planlar icin
-- ------------------------------------------------------------------
('tc11a1b2-c3d4-e5f6-a7b8-c9d0e1f2a011', 'theme_secondary_hsl', '220 14% 96%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- MUTED COLOR (Soluk Renk)
-- Soluk metinler ve arka planlar icin
-- ------------------------------------------------------------------
('tc12a1b2-c3d4-e5f6-a7b8-c9d0e1f2a012', 'theme_muted_hsl', '210 20% 96%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- MUTED FOREGROUND (Soluk Metin Rengi)
-- Ikincil metinler, aciklamalar icin
-- ------------------------------------------------------------------
('tc13a1b2-c3d4-e5f6-a7b8-c9d0e1f2a013', 'theme_muted_foreground_hsl', '215 16% 47%', NOW(3), NOW(3)),

-- ==================================================================
-- FONT AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- THEME FONT PRESET
-- Yazi tipi secimi
-- Degerler: inter, poppins, roboto, nunito, montserrat, openSans, lato, sourceSans
-- ------------------------------------------------------------------
('tc08a1b2-c3d4-e5f6-a7b8-c9d0e1f2a008', 'theme_font_preset', 'inter', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- FONT WEIGHT PRESET
-- Varsayilan font kalinligi
-- Degerler: light, normal, medium, semibold
-- ------------------------------------------------------------------
('tc14a1b2-c3d4-e5f6-a7b8-c9d0e1f2a014', 'theme_font_weight_preset', 'normal', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- LETTER SPACING PRESET
-- Harf araligi
-- Degerler: tight, normal, wide
-- ------------------------------------------------------------------
('tc15a1b2-c3d4-e5f6-a7b8-c9d0e1f2a015', 'theme_letter_spacing_preset', 'normal', NOW(3), NOW(3)),

-- ==================================================================
-- BORDER RADIUS AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- THEME RADIUS PRESET
-- Kose yuvarlaklik secimi
-- Degerler: none, sm, md, lg, xl, 2xl, full
-- ------------------------------------------------------------------
('tc09a1b2-c3d4-e5f6-a7b8-c9d0e1f2a009', 'theme_radius_preset', 'lg', NOW(3), NOW(3)),

-- ==================================================================
-- SHADOW AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- THEME SHADOW PRESET
-- Golge yogunlugu secimi
-- Degerler: none, soft, normal, strong, dramatic
-- ------------------------------------------------------------------
('tc10a1b2-c3d4-e5f6-a7b8-c9d0e1f2a010', 'theme_shadow_preset', 'normal', NOW(3), NOW(3)),

-- ==================================================================
-- ARKAPLAN VE KART AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- BACKGROUND TONE PRESET
-- Arka plan renk tonu
-- Degerler: neutral, warm, cool, slate
-- ------------------------------------------------------------------
('tc16a1b2-c3d4-e5f6-a7b8-c9d0e1f2a016', 'theme_background_tone_preset', 'neutral', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- CARD STYLE PRESET
-- Kart gorunumu stili
-- Degerler: default, glass, flat, elevated
-- ------------------------------------------------------------------
('tc17a1b2-c3d4-e5f6-a7b8-c9d0e1f2a017', 'theme_card_style_preset', 'default', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- BORDER STYLE PRESET
-- Kenarlik stili
-- Degerler: none, subtle, normal, strong
-- ------------------------------------------------------------------
('tc18a1b2-c3d4-e5f6-a7b8-c9d0e1f2a018', 'theme_border_style_preset', 'normal', NOW(3), NOW(3)),

-- ==================================================================
-- ANIMASYON AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- ANIMATION SPEED PRESET
-- Gecis animasyonu hizi
-- Degerler: none, fast, normal, slow
-- ------------------------------------------------------------------
('tc19a1b2-c3d4-e5f6-a7b8-c9d0e1f2a019', 'theme_animation_speed_preset', 'normal', NOW(3), NOW(3)),

-- ==================================================================
-- HERO / NAVY RENKLERI
-- ==================================================================

-- ------------------------------------------------------------------
-- NAVY COLOR (Hero bolumu icin koyu renk)
-- Hero, header vb. koyu arka planlar icin
-- ------------------------------------------------------------------
('tc20a1b2-c3d4-e5f6-a7b8-c9d0e1f2a020', 'theme_navy_hsl', '222 47% 11%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- NAVY LIGHT (Hero bolumu icin acik koyu renk)
-- Gradientler icin
-- ------------------------------------------------------------------
('tc21a1b2-c3d4-e5f6-a7b8-c9d0e1f2a021', 'theme_navy_light_hsl', '220 26% 14%', NOW(3), NOW(3)),

-- ==================================================================
-- GRAFIK RENKLERI
-- ==================================================================

-- ------------------------------------------------------------------
-- CHART PALETTE PRESET
-- Grafik renk paleti
-- Degerler: default, warm, cool, monochrome, vibrant
-- ------------------------------------------------------------------
('tc22a1b2-c3d4-e5f6-a7b8-c9d0e1f2a022', 'theme_chart_palette_preset', 'default', NOW(3), NOW(3)),

-- ==================================================================
-- DARK MODE AYARLARI
-- ==================================================================

-- ------------------------------------------------------------------
-- DARK MODE BACKGROUND
-- Dark modda arka plan rengi
-- ------------------------------------------------------------------
('tc23a1b2-c3d4-e5f6-a7b8-c9d0e1f2a023', 'theme_dark_background_hsl', '222 47% 11%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- DARK MODE CARD
-- Dark modda kart arka plan rengi
-- ------------------------------------------------------------------
('tc24a1b2-c3d4-e5f6-a7b8-c9d0e1f2a024', 'theme_dark_card_hsl', '220 26% 14%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- DARK MODE MUTED
-- Dark modda soluk arka plan rengi
-- ------------------------------------------------------------------
('tc25a1b2-c3d4-e5f6-a7b8-c9d0e1f2a025', 'theme_dark_muted_hsl', '217 33% 17%', NOW(3), NOW(3)),

-- ------------------------------------------------------------------
-- DARK MODE BORDER
-- Dark modda kenarlik rengi
-- ------------------------------------------------------------------
('tc26a1b2-c3d4-e5f6-a7b8-c9d0e1f2a026', 'theme_dark_border_hsl', '217 33% 17%', NOW(3), NOW(3))

ON DUPLICATE KEY UPDATE
  `value`      = VALUES(`value`),
  `updated_at` = VALUES(`updated_at`);
