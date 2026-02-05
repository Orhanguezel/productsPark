// =============================================================
// FILE: src/pages/admin/settings/components/ThemeColorsSettingsCard.tsx
// Tema Ayarları - Renkler, Font, Border Radius, Shadow, Arka Plan, Animasyon vb.
// =============================================================
'use client';

import type { Dispatch, SetStateAction } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Palette,
  Paintbrush,
  Check,
  Type,
  Square,
  Sparkles,
  Sun,
  Moon,
  Layers,
  Zap,
  BarChart3,
  Layout,
  PenTool,
  RotateCcw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// ==================== PRESETS ====================

// Renk presetleri
const COLOR_PRESETS: Record<string, { primary: string; glow: string; label: string; hex: string }> =
  {
    green: { primary: '142 76% 36%', glow: '142 71% 45%', label: 'Yeşil', hex: '#22c55e' },
    blue: { primary: '221 83% 53%', glow: '221 83% 63%', label: 'Mavi', hex: '#3b82f6' },
    purple: { primary: '262 83% 58%', glow: '262 83% 68%', label: 'Mor', hex: '#a855f7' },
    orange: { primary: '25 95% 53%', glow: '25 95% 63%', label: 'Turuncu', hex: '#f97316' },
    red: { primary: '0 84% 60%', glow: '0 84% 70%', label: 'Kırmızı', hex: '#ef4444' },
    cyan: { primary: '190 90% 50%', glow: '190 90% 60%', label: 'Camgöbeği', hex: '#06b6d4' },
    teal: { primary: '168 76% 42%', glow: '168 76% 52%', label: 'Deniz Mavisi', hex: '#14b8a6' },
    pink: { primary: '330 81% 60%', glow: '330 81% 70%', label: 'Pembe', hex: '#ec4899' },
    custom: { primary: '', glow: '', label: 'Özel Renk', hex: '#888888' },
  };

// Font presetleri
const FONT_PRESETS: Record<string, { label: string; family: string }> = {
  inter: { label: 'Inter', family: "'Inter', sans-serif" },
  poppins: { label: 'Poppins', family: "'Poppins', sans-serif" },
  roboto: { label: 'Roboto', family: "'Roboto', sans-serif" },
  nunito: { label: 'Nunito', family: "'Nunito', sans-serif" },
  montserrat: { label: 'Montserrat', family: "'Montserrat', sans-serif" },
  openSans: { label: 'Open Sans', family: "'Open Sans', sans-serif" },
  lato: { label: 'Lato', family: "'Lato', sans-serif" },
  sourceSans: { label: 'Source Sans 3', family: "'Source Sans 3', sans-serif" },
};

// Font weight presetleri
const FONT_WEIGHT_PRESETS: Record<string, { label: string; value: string }> = {
  light: { label: 'Hafif (300)', value: '300' },
  normal: { label: 'Normal (400)', value: '400' },
  medium: { label: 'Orta (500)', value: '500' },
  semibold: { label: 'Yarı Kalın (600)', value: '600' },
};

// Letter spacing presetleri
const LETTER_SPACING_PRESETS: Record<string, { label: string; value: string }> = {
  tight: { label: 'Sıkı', value: '-0.025em' },
  normal: { label: 'Normal', value: '0' },
  wide: { label: 'Geniş', value: '0.025em' },
};

// Border radius presetleri
const RADIUS_PRESETS: Record<string, { label: string; value: string }> = {
  none: { label: 'Yok', value: '0' },
  sm: { label: 'Küçük', value: '0.375rem' },
  md: { label: 'Orta', value: '0.5rem' },
  lg: { label: 'Büyük (Varsayılan)', value: '0.75rem' },
  xl: { label: 'Çok Büyük', value: '1rem' },
  '2xl': { label: 'Ekstra Büyük', value: '1.5rem' },
  full: { label: 'Tam Yuvarlak', value: '9999px' },
};

// Shadow presetleri
const SHADOW_PRESETS: Record<string, { label: string; card: string }> = {
  none: { label: 'Yok', card: 'none' },
  soft: { label: 'Hafif', card: '0 2px 8px -2px rgba(0,0,0,0.05)' },
  normal: { label: 'Normal (Varsayılan)', card: '0 4px 20px -4px rgba(0,0,0,0.1)' },
  strong: { label: 'Güçlü', card: '0 8px 30px -6px rgba(0,0,0,0.15)' },
  dramatic: { label: 'Dramatik', card: '0 12px 40px -8px rgba(0,0,0,0.2)' },
};

// Background tone presetleri
const BACKGROUND_TONE_PRESETS: Record<string, { label: string; lightBg: string; darkBg: string }> =
  {
    neutral: { label: 'Nötr (Varsayılan)', lightBg: '#fafbfc', darkBg: '#0f172a' },
    warm: { label: 'Sıcak', lightBg: '#fdfbf7', darkBg: '#1a1412' },
    cool: { label: 'Soğuk', lightBg: '#f8fafc', darkBg: '#0c1220' },
    slate: { label: 'Gri', lightBg: '#f1f5f9', darkBg: '#0f1318' },
  };

// Card style presetleri
const CARD_STYLE_PRESETS: Record<string, { label: string; description: string }> = {
  default: { label: 'Varsayılan', description: 'Standart kart stili' },
  glass: { label: 'Cam Efekti', description: 'Yarı saydam, bulanık arka plan' },
  flat: { label: 'Düz', description: 'Kenarlık ve gölge yok' },
  elevated: { label: 'Yükseltilmiş', description: 'Güçlü gölge ile havada duran' },
};

// Border style presetleri
const BORDER_STYLE_PRESETS: Record<string, { label: string; description: string }> = {
  none: { label: 'Yok', description: 'Kenarlık gösterme' },
  subtle: { label: 'Hafif', description: 'Çok ince, soluk kenarlık' },
  normal: { label: 'Normal (Varsayılan)', description: 'Standart kenarlık' },
  strong: { label: 'Güçlü', description: 'Kalın, belirgin kenarlık' },
};

// Animation speed presetleri
const ANIMATION_SPEED_PRESETS: Record<string, { label: string; description: string }> = {
  none: { label: 'Yok', description: 'Animasyon devre dışı' },
  fast: { label: 'Hızlı', description: '150ms geçişler' },
  normal: { label: 'Normal (Varsayılan)', description: '300ms geçişler' },
  slow: { label: 'Yavaş', description: '500ms geçişler' },
};

// Chart palette presetleri
const CHART_PALETTE_PRESETS: Record<string, { label: string; colors: string[] }> = {
  default: {
    label: 'Varsayılan',
    colors: ['#22c55e', '#3b82f6', '#a855f7', '#45c471', '#facc15'],
  },
  warm: { label: 'Sıcak', colors: ['#f97316', '#ef4444', '#ec4899', '#facc15', '#fb7185'] },
  cool: { label: 'Soğuk', colors: ['#3b82f6', '#06b6d4', '#a855f7', '#14b8a6', '#38bdf8'] },
  monochrome: {
    label: 'Tek Renk',
    colors: ['#1e293b', '#475569', '#64748b', '#94a3b8', '#cbd5e1'],
  },
  vibrant: { label: 'Canlı', colors: ['#ef4444', '#facc15', '#22c55e', '#3b82f6', '#a855f7'] },
};

const PRESET_OPTIONS = Object.entries(COLOR_PRESETS).map(([value, { label, hex }]) => ({
  value,
  label,
  hex,
}));

// Varsayılan tema değerleri - Reset butonu için
const DEFAULT_THEME_VALUES: Record<string, string> = {
  theme_colors_enabled: 'true',
  theme_color_preset: 'green',
  theme_primary_hsl: '142 76% 36%',
  theme_primary_glow_hsl: '142 71% 45%',
  theme_accent_hsl: '142 76% 36%',
  theme_success_hsl: '142 76% 36%',
  theme_destructive_hsl: '0 84% 60%',
  theme_secondary_hsl: '220 14% 96%',
  theme_muted_hsl: '210 20% 96%',
  theme_muted_foreground_hsl: '215 16% 47%',
  theme_font_preset: 'inter',
  theme_font_weight_preset: 'normal',
  theme_letter_spacing_preset: 'normal',
  theme_radius_preset: 'lg',
  theme_shadow_preset: 'normal',
  theme_background_tone_preset: 'neutral',
  theme_card_style_preset: 'default',
  theme_border_style_preset: 'normal',
  theme_animation_speed_preset: 'normal',
  theme_navy_hsl: '222 47% 11%',
  theme_navy_light_hsl: '220 26% 14%',
  theme_chart_palette_preset: 'default',
  theme_dark_background_hsl: '222 47% 11%',
  theme_dark_card_hsl: '220 26% 14%',
  theme_dark_muted_hsl: '217 33% 17%',
  theme_dark_border_hsl: '217 33% 17%',
};

interface Props {
  settings: {
    theme_colors_enabled: string;
    theme_color_preset: string;
    theme_primary_hsl: string;
    theme_primary_glow_hsl: string;
    theme_accent_hsl: string;
    theme_success_hsl: string;
    theme_destructive_hsl: string;
    theme_secondary_hsl?: string;
    theme_muted_hsl?: string;
    theme_muted_foreground_hsl?: string;
    theme_font_preset: string;
    theme_font_weight_preset?: string;
    theme_letter_spacing_preset?: string;
    theme_radius_preset: string;
    theme_shadow_preset: string;
    theme_background_tone_preset?: string;
    theme_card_style_preset?: string;
    theme_border_style_preset?: string;
    theme_animation_speed_preset?: string;
    theme_navy_hsl?: string;
    theme_navy_light_hsl?: string;
    theme_chart_palette_preset?: string;
    theme_dark_background_hsl?: string;
    theme_dark_card_hsl?: string;
    theme_dark_muted_hsl?: string;
    theme_dark_border_hsl?: string;
  };
  setSettings: Dispatch<SetStateAction<any>>;
}

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));
const toBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'true';
  return false;
};

// HSL string'den hex'e dönüştür (önizleme için)
function hslToHex(hslStr: string): string {
  if (!hslStr) return '#888888';

  const parts = hslStr.split(' ').map((p) => parseFloat(p.replace('%', '')));
  if (parts.length < 3) return '#888888';

  const h = parts[0];
  const s = parts[1];
  const l = parts[2];

  if (h === undefined || s === undefined || l === undefined) return '#888888';
  if (isNaN(h) || isNaN(s) || isNaN(l)) return '#888888';

  const sNorm = s / 100;
  const lNorm = l / 100;

  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = lNorm - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (h < 60) {
    r = c;
    g = x;
  } else if (h < 120) {
    r = x;
    g = c;
  } else if (h < 180) {
    g = c;
    b = x;
  } else if (h < 240) {
    g = x;
    b = c;
  } else if (h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Renk önizleme kartı
function ColorPreviewCard({
  label,
  hsl,
  description,
}: {
  label: string;
  hsl: string;
  description?: string;
}) {
  const hex = hslToHex(hsl);
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card">
      <div
        className="w-10 h-10 rounded-lg border shadow-sm flex-shrink-0"
        style={{ backgroundColor: hex }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground truncate">{description}</p>}
        <p className="text-xs font-mono text-muted-foreground">{hsl || '—'}</p>
      </div>
    </div>
  );
}

// HSL Input Component
function HslInput({
  label,
  description,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  description?: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <div
          className="w-10 h-10 rounded border flex-shrink-0"
          style={{ backgroundColor: hslToHex(value) }}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      </div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

export default function ThemeColorsSettingsCard({ settings, setSettings }: Props) {
  const isEnabled = toBool(settings.theme_colors_enabled);
  const colorPreset = toStr(settings.theme_color_preset) || 'green';
  const fontPreset = toStr(settings.theme_font_preset) || 'inter';
  const fontWeightPreset = toStr(settings.theme_font_weight_preset) || 'normal';
  const letterSpacingPreset = toStr(settings.theme_letter_spacing_preset) || 'normal';
  const radiusPreset = toStr(settings.theme_radius_preset) || 'lg';
  const shadowPreset = toStr(settings.theme_shadow_preset) || 'normal';
  const backgroundTonePreset = toStr(settings.theme_background_tone_preset) || 'neutral';
  const cardStylePreset = toStr(settings.theme_card_style_preset) || 'default';
  const borderStylePreset = toStr(settings.theme_border_style_preset) || 'normal';
  const animationSpeedPreset = toStr(settings.theme_animation_speed_preset) || 'normal';
  const chartPalettePreset = toStr(settings.theme_chart_palette_preset) || 'default';
  const isCustomColor = colorPreset === 'custom';

  // Mevcut renkleri hesapla (preset veya custom)
  const currentColors = isCustomColor
    ? {
        primary: toStr(settings.theme_primary_hsl) || '142 76% 36%',
        glow: toStr(settings.theme_primary_glow_hsl) || '142 71% 45%',
        accent: toStr(settings.theme_accent_hsl) || '142 76% 36%',
        success: toStr(settings.theme_success_hsl) || '142 76% 36%',
        destructive: toStr(settings.theme_destructive_hsl) || '0 84% 60%',
      }
    : {
        primary: COLOR_PRESETS[colorPreset]?.primary || '142 76% 36%',
        glow: COLOR_PRESETS[colorPreset]?.glow || '142 71% 45%',
        accent: COLOR_PRESETS[colorPreset]?.primary || '142 76% 36%',
        success: COLOR_PRESETS[colorPreset]?.primary || '142 76% 36%',
        destructive: '0 84% 60%',
      };

  const update = (key: string, value: string) => {
    setSettings((prev: Record<string, unknown>) => ({ ...prev, [key]: value }));
  };

  // Tüm tema ayarlarını varsayılana sıfırla
  const resetToDefaults = () => {
    setSettings((prev: Record<string, unknown>) => ({
      ...prev,
      ...DEFAULT_THEME_VALUES,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Ana Kontrol Kartı */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Tema Ayarları
              </CardTitle>
              <CardDescription className="mt-1.5">
                Sitenizin görsel stilini özelleştirin: renkler, yazı tipi, köşe yuvarlaklığı, gölgeler ve
                daha fazlası.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={resetToDefaults}
              className="gap-2 shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
              Varsayılana Sıfırla
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Aktif/Pasif */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="theme_colors_enabled" className="text-base font-medium">
                Dinamik Tema Ayarları
              </Label>
              <p className="text-sm text-muted-foreground">
                Kapatırsanız varsayılan tema kullanılır
              </p>
            </div>
            <Switch
              id="theme_colors_enabled"
              checked={isEnabled}
              onCheckedChange={(checked) =>
                update('theme_colors_enabled', checked ? 'true' : 'false')
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Tab yapısı */}
      {isEnabled && (
        <Tabs defaultValue="colors" className="w-full">
          <TabsList className="grid grid-cols-2 md:grid-cols-5 mb-4">
            <TabsTrigger value="colors" className="gap-1">
              <Paintbrush className="w-4 h-4" />
              <span className="hidden sm:inline">Renkler</span>
            </TabsTrigger>
            <TabsTrigger value="typography" className="gap-1">
              <Type className="w-4 h-4" />
              <span className="hidden sm:inline">Tipografi</span>
            </TabsTrigger>
            <TabsTrigger value="layout" className="gap-1">
              <Layout className="w-4 h-4" />
              <span className="hidden sm:inline">Düzen</span>
            </TabsTrigger>
            <TabsTrigger value="effects" className="gap-1">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Efektler</span>
            </TabsTrigger>
            <TabsTrigger value="dark" className="gap-1">
              <Moon className="w-4 h-4" />
              <span className="hidden sm:inline">Dark Mode</span>
            </TabsTrigger>
          </TabsList>

          {/* ==================== RENKLER TAB ==================== */}
          <TabsContent value="colors" className="space-y-6">
            {/* Ana Renk Şeması */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Paintbrush className="w-5 h-5" />
                  Ana Renk Şeması
                </CardTitle>
                <CardDescription>
                  Hazır bir renk şeması seçin veya özel HSL değerleri girin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Preset Seçimi */}
                <div className="space-y-3">
                  <Label htmlFor="theme_color_preset">Renk Paleti</Label>
                  <Select value={colorPreset} onValueChange={(v) => update('theme_color_preset', v)}>
                    <SelectTrigger id="theme_color_preset" className="w-full">
                      <SelectValue placeholder="Renk seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRESET_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: opt.hex }}
                            />
                            <span>{opt.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preset Grid */}
                {!isCustomColor && (
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {Object.entries(COLOR_PRESETS)
                      .filter(([key]) => key !== 'custom')
                      .map(([key, { label, hex }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => update('theme_color_preset', key)}
                          className={`
                            relative p-1 rounded-lg border-2 transition-all
                            ${colorPreset === key ? 'border-primary ring-2 ring-primary/30' : 'border-transparent hover:border-muted-foreground/30'}
                          `}
                          title={label}
                        >
                          <div
                            className="w-full aspect-square rounded-md shadow-sm"
                            style={{ backgroundColor: hex }}
                          />
                          {colorPreset === key && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Check className="w-4 h-4 text-white drop-shadow-md" />
                            </div>
                          )}
                        </button>
                      ))}
                  </div>
                )}

                {/* Özel Renk Ayarları */}
                {isCustomColor && (
                  <div className="space-y-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      HSL formatında renk değerleri girin (örn: "142 76% 36%")
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <HslInput
                        label="Ana Renk (Primary)"
                        description="Butonlar, linkler, vurgular"
                        value={toStr(settings.theme_primary_hsl)}
                        onChange={(v) => update('theme_primary_hsl', v)}
                        placeholder="142 76% 36%"
                      />
                      <HslInput
                        label="Parlak Versiyon (Glow)"
                        description="Hover efektleri, gradientler"
                        value={toStr(settings.theme_primary_glow_hsl)}
                        onChange={(v) => update('theme_primary_glow_hsl', v)}
                        placeholder="142 71% 45%"
                      />
                      <HslInput
                        label="Vurgu Rengi (Accent)"
                        description="Genellikle primary ile aynı"
                        value={toStr(settings.theme_accent_hsl)}
                        onChange={(v) => update('theme_accent_hsl', v)}
                        placeholder="142 76% 36%"
                      />
                      <HslInput
                        label="Başarı Rengi (Success)"
                        description="Onay mesajları"
                        value={toStr(settings.theme_success_hsl)}
                        onChange={(v) => update('theme_success_hsl', v)}
                        placeholder="142 76% 36%"
                      />
                      <HslInput
                        label="Hata Rengi (Destructive)"
                        description="Hata mesajları, silme butonları"
                        value={toStr(settings.theme_destructive_hsl)}
                        onChange={(v) => update('theme_destructive_hsl', v)}
                        placeholder="0 84% 60%"
                      />
                    </div>
                  </div>
                )}

                {/* Renk Önizleme */}
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-3">Renk Önizlemesi</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <ColorPreviewCard
                      label="Primary"
                      hsl={currentColors.primary}
                      description="Ana renk"
                    />
                    <ColorPreviewCard
                      label="Glow"
                      hsl={currentColors.glow}
                      description="Parlak versiyon"
                    />
                    <ColorPreviewCard
                      label="Destructive"
                      hsl={currentColors.destructive}
                      description="Hata/Silme"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* İkincil Renkler */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5" />
                  İkincil Renkler
                </CardTitle>
                <CardDescription>Secondary, muted ve diğer yardımcı renkler.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HslInput
                    label="İkincil Renk (Secondary)"
                    description="Secondary butonlar ve arka planlar"
                    value={toStr(settings.theme_secondary_hsl) || '220 14% 96%'}
                    onChange={(v) => update('theme_secondary_hsl', v)}
                    placeholder="220 14% 96%"
                  />
                  <HslInput
                    label="Soluk Renk (Muted)"
                    description="Soluk arka planlar"
                    value={toStr(settings.theme_muted_hsl) || '210 20% 96%'}
                    onChange={(v) => update('theme_muted_hsl', v)}
                    placeholder="210 20% 96%"
                  />
                  <HslInput
                    label="Soluk Metin (Muted Foreground)"
                    description="İkincil metinler, açıklamalar"
                    value={toStr(settings.theme_muted_foreground_hsl) || '215 16% 47%'}
                    onChange={(v) => update('theme_muted_foreground_hsl', v)}
                    placeholder="215 16% 47%"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hero/Navy Renkleri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sun className="w-5 h-5" />
                  Hero / Koyu Arka Plan
                </CardTitle>
                <CardDescription>
                  Hero bölümü ve koyu arka planlı alanlar için renkler.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HslInput
                    label="Navy (Koyu)"
                    description="Hero ve header arka planı"
                    value={toStr(settings.theme_navy_hsl) || '222 47% 11%'}
                    onChange={(v) => update('theme_navy_hsl', v)}
                    placeholder="222 47% 11%"
                  />
                  <HslInput
                    label="Navy Light (Açık Koyu)"
                    description="Gradient için"
                    value={toStr(settings.theme_navy_light_hsl) || '220 26% 14%'}
                    onChange={(v) => update('theme_navy_light_hsl', v)}
                    placeholder="220 26% 14%"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Grafik Renkleri */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BarChart3 className="w-5 h-5" />
                  Grafik Renk Paleti
                </CardTitle>
                <CardDescription>
                  Dashboard ve istatistik grafikleri için renk paleti.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Renk Paleti</Label>
                  <Select
                    value={chartPalettePreset}
                    onValueChange={(v) => update('theme_chart_palette_preset', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Palet seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CHART_PALETTE_PRESETS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Palette Preview */}
                <div className="flex flex-wrap gap-3 p-4 rounded-lg border bg-muted/30">
                  {Object.entries(CHART_PALETTE_PRESETS).map(([key, { label, colors }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update('theme_chart_palette_preset', key)}
                      className={`
                        p-3 rounded-lg border-2 transition-all
                        ${chartPalettePreset === key ? 'border-primary' : 'border-transparent hover:border-muted-foreground/30'}
                      `}
                    >
                      <div className="flex gap-1 mb-2">
                        {colors.map((color, i) => (
                          <div
                            key={i}
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-medium">{label}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== TİPOGRAFİ TAB ==================== */}
          <TabsContent value="typography" className="space-y-6">
            {/* Yazı Tipi */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Type className="w-5 h-5" />
                  Yazı Tipi
                </CardTitle>
                <CardDescription>Sitenizde kullanılacak yazı tipini seçin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="theme_font_preset">Font Ailesi</Label>
                  <Select value={fontPreset} onValueChange={(v) => update('theme_font_preset', v)}>
                    <SelectTrigger id="theme_font_preset" className="w-full">
                      <SelectValue placeholder="Font seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(FONT_PRESETS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Önizleme */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Önizleme</p>
                  <p
                    className="text-2xl font-bold"
                    style={{
                      fontFamily: FONT_PRESETS[fontPreset]?.family ?? "'Inter', sans-serif",
                    }}
                  >
                    {FONT_PRESETS[fontPreset]?.label ?? 'Inter'}
                  </p>
                  <p
                    className="text-base mt-1"
                    style={{
                      fontFamily: FONT_PRESETS[fontPreset]?.family ?? "'Inter', sans-serif",
                    }}
                  >
                    Hızlı kahverengi tilki tembel köpeğin üzerinden atlar. 0123456789
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Font Ağırlığı ve Harf Aralığı */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <PenTool className="w-5 h-5" />
                  Tipografi Detayları
                </CardTitle>
                <CardDescription>
                  Font kalınlığı ve harf aralığını özelleştirin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Font Weight */}
                  <div className="space-y-3">
                    <Label>Font Kalınlığı</Label>
                    <Select
                      value={fontWeightPreset}
                      onValueChange={(v) => update('theme_font_weight_preset', v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Kalınlık seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(FONT_WEIGHT_PRESETS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Letter Spacing */}
                  <div className="space-y-3">
                    <Label>Harf Aralığı</Label>
                    <Select
                      value={letterSpacingPreset}
                      onValueChange={(v) => update('theme_letter_spacing_preset', v)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Aralık seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(LETTER_SPACING_PRESETS).map(([value, { label }]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview */}
                <div className="p-4 rounded-lg border bg-muted/30">
                  <p className="text-sm text-muted-foreground mb-2">Önizleme</p>
                  <p
                    className="text-lg"
                    style={{
                      fontFamily: FONT_PRESETS[fontPreset]?.family ?? "'Inter', sans-serif",
                      fontWeight: FONT_WEIGHT_PRESETS[fontWeightPreset]?.value ?? '400',
                      letterSpacing: LETTER_SPACING_PRESETS[letterSpacingPreset]?.value ?? '0',
                    }}
                  >
                    Örnek metin: Kalınlık ve harf aralığı önizlemesi
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== DÜZEN TAB ==================== */}
          <TabsContent value="layout" className="space-y-6">
            {/* Köşe Yuvarlaklığı */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Square className="w-5 h-5" />
                  Köşe Yuvarlaklığı
                </CardTitle>
                <CardDescription>
                  Butonlar, kartlar ve diğer bileşenlerin köşe yuvarlaklığını ayarlayın.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="theme_radius_preset">Radius Boyutu</Label>
                  <Select
                    value={radiusPreset}
                    onValueChange={(v) => update('theme_radius_preset', v)}
                  >
                    <SelectTrigger id="theme_radius_preset" className="w-full">
                      <SelectValue placeholder="Radius seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RADIUS_PRESETS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Radius Önizleme */}
                <div className="flex flex-wrap gap-3 p-4 rounded-lg border bg-muted/30">
                  {Object.entries(RADIUS_PRESETS).map(([key, { label, value }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update('theme_radius_preset', key)}
                      className={`
                        w-16 h-16 border-2 transition-all flex items-center justify-center text-xs
                        ${radiusPreset === key ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground/50'}
                      `}
                      style={{ borderRadius: value }}
                      title={label}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Arka Plan Tonu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sun className="w-5 h-5" />
                  Arka Plan Tonu
                </CardTitle>
                <CardDescription>
                  Sayfa arka planının genel renk tonunu seçin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Ton</Label>
                  <Select
                    value={backgroundTonePreset}
                    onValueChange={(v) => update('theme_background_tone_preset', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Ton seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BACKGROUND_TONE_PRESETS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Preview */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg border bg-muted/30">
                  {Object.entries(BACKGROUND_TONE_PRESETS).map(
                    ([key, { label, lightBg, darkBg }]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => update('theme_background_tone_preset', key)}
                        className={`
                        p-3 rounded-lg border-2 transition-all
                        ${backgroundTonePreset === key ? 'border-primary' : 'border-transparent'}
                      `}
                      >
                        <div className="flex gap-1 mb-2">
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: lightBg }}
                            title="Light"
                          />
                          <div
                            className="w-8 h-8 rounded border"
                            style={{ backgroundColor: darkBg }}
                            title="Dark"
                          />
                        </div>
                        <p className="text-xs font-medium">{label}</p>
                      </button>
                    ),
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Kart Stili */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Layers className="w-5 h-5" />
                  Kart Stili
                </CardTitle>
                <CardDescription>Kartların genel görünümünü seçin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Stil</Label>
                  <Select
                    value={cardStylePreset}
                    onValueChange={(v) => update('theme_card_style_preset', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Stil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(CARD_STYLE_PRESETS).map(([value, { label, description }]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <span>{label}</span>
                            <span className="text-xs text-muted-foreground ml-2">
                              - {description}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Kenarlık Stili */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Square className="w-5 h-5" />
                  Kenarlık Stili
                </CardTitle>
                <CardDescription>Bileşenlerin kenarlık kalınlığını ayarlayın.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Kenarlık</Label>
                  <Select
                    value={borderStylePreset}
                    onValueChange={(v) => update('theme_border_style_preset', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Stil seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(BORDER_STYLE_PRESETS).map(
                        ([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                - {description}
                              </span>
                            </div>
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== EFEKTLER TAB ==================== */}
          <TabsContent value="effects" className="space-y-6">
            {/* Gölge */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5" />
                  Gölge Efektleri
                </CardTitle>
                <CardDescription>
                  Kartlar ve bileşenler için gölge yoğunluğunu ayarlayın.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label htmlFor="theme_shadow_preset">Gölge Yoğunluğu</Label>
                  <Select
                    value={shadowPreset}
                    onValueChange={(v) => update('theme_shadow_preset', v)}
                  >
                    <SelectTrigger id="theme_shadow_preset" className="w-full">
                      <SelectValue placeholder="Gölge seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(SHADOW_PRESETS).map(([value, { label }]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Shadow Önizleme */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 p-4 rounded-lg border bg-muted/30">
                  {Object.entries(SHADOW_PRESETS).map(([key, { label, card }]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => update('theme_shadow_preset', key)}
                      className={`
                        p-4 bg-card border-2 rounded-lg transition-all text-center
                        ${shadowPreset === key ? 'border-primary' : 'border-transparent'}
                      `}
                      style={{ boxShadow: card }}
                    >
                      <span className="text-xs font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Animasyon Hızı */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="w-5 h-5" />
                  Animasyon Hızı
                </CardTitle>
                <CardDescription>
                  Hover efektleri ve geçişlerin hızını ayarlayın.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <Label>Hız</Label>
                  <Select
                    value={animationSpeedPreset}
                    onValueChange={(v) => update('theme_animation_speed_preset', v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Hız seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ANIMATION_SPEED_PRESETS).map(
                        ([value, { label, description }]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                - {description}
                              </span>
                            </div>
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ==================== DARK MODE TAB ==================== */}
          <TabsContent value="dark" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Moon className="w-5 h-5" />
                  Dark Mode Renkleri
                </CardTitle>
                <CardDescription>
                  Karanlık tema için özel arka plan ve kenarlık renkleri.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <HslInput
                    label="Arka Plan"
                    description="Dark mode ana arka plan"
                    value={toStr(settings.theme_dark_background_hsl) || '222 47% 11%'}
                    onChange={(v) => update('theme_dark_background_hsl', v)}
                    placeholder="222 47% 11%"
                  />
                  <HslInput
                    label="Kart Arka Planı"
                    description="Kartların arka planı"
                    value={toStr(settings.theme_dark_card_hsl) || '220 26% 14%'}
                    onChange={(v) => update('theme_dark_card_hsl', v)}
                    placeholder="220 26% 14%"
                  />
                  <HslInput
                    label="Muted Arka Plan"
                    description="Soluk alanların arka planı"
                    value={toStr(settings.theme_dark_muted_hsl) || '217 33% 17%'}
                    onChange={(v) => update('theme_dark_muted_hsl', v)}
                    placeholder="217 33% 17%"
                  />
                  <HslInput
                    label="Kenarlık Rengi"
                    description="Dark mode kenarlıklar"
                    value={toStr(settings.theme_dark_border_hsl) || '217 33% 17%'}
                    onChange={(v) => update('theme_dark_border_hsl', v)}
                    placeholder="217 33% 17%"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Genel Önizleme */}
      {isEnabled && (
        <Card>
          <CardHeader>
            <CardTitle>Genel Önizleme</CardTitle>
            <CardDescription>Tüm tema ayarlarının bir arada görünümü</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="p-6 rounded-lg border bg-card"
              style={{
                fontFamily: FONT_PRESETS[fontPreset]?.family ?? "'Inter', sans-serif",
                boxShadow: SHADOW_PRESETS[shadowPreset]?.card ?? 'none',
                borderRadius: RADIUS_PRESETS[radiusPreset]?.value ?? '0.75rem',
              }}
            >
              <h3
                className="text-lg mb-2"
                style={{
                  fontWeight: FONT_WEIGHT_PRESETS[fontWeightPreset]?.value ?? '600',
                  letterSpacing: LETTER_SPACING_PRESETS[letterSpacingPreset]?.value ?? '0',
                }}
              >
                Örnek Kart Başlığı
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Bu bir örnek açıklama metnidir. Seçtiğiniz tema ayarları bu kartta nasıl görüneceğini
                gösterir.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-4 py-2 text-white text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: hslToHex(currentColors.primary),
                    borderRadius: RADIUS_PRESETS[radiusPreset]?.value ?? '0.75rem',
                  }}
                >
                  Primary Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-white text-sm font-medium transition-colors"
                  style={{
                    background: `linear-gradient(135deg, ${hslToHex(currentColors.primary)}, ${hslToHex(currentColors.glow)})`,
                    borderRadius: RADIUS_PRESETS[radiusPreset]?.value ?? '0.75rem',
                  }}
                >
                  Gradient Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border text-sm font-medium"
                  style={{
                    borderRadius: RADIUS_PRESETS[radiusPreset]?.value ?? '0.75rem',
                    borderColor: hslToHex(currentColors.primary),
                    color: hslToHex(currentColors.primary),
                  }}
                >
                  Outline Button
                </button>
                <button
                  type="button"
                  className="px-4 py-2 text-white text-sm font-medium"
                  style={{
                    backgroundColor: hslToHex(currentColors.destructive),
                    borderRadius: RADIUS_PRESETS[radiusPreset]?.value ?? '0.75rem',
                  }}
                >
                  Destructive
                </button>
              </div>

              {/* Chart Preview */}
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm font-medium mb-2">Grafik Renkleri</p>
                <div className="flex gap-2">
                  {(CHART_PALETTE_PRESETS[chartPalettePreset]?.colors ?? []).map((color, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: color }}
                      title={`Chart ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
