// =============================================================
// FILE: src/hooks/useThemeColors.ts
// Dinamik tema ayarları - site_settings'ten CSS variables uygular
// Renkler, Font, Border Radius, Shadow, Arka Plan, Animasyon vb.
// =============================================================

import { useEffect, useMemo } from 'react';
import { useGetSiteSettingByKeyQuery } from '@/integrations/hooks';

// ==================== PRESETS ====================

// Renk presetleri
const COLOR_PRESETS: Record<string, { primary: string; glow: string }> = {
  green: { primary: '142 76% 36%', glow: '142 71% 45%' },
  blue: { primary: '221 83% 53%', glow: '221 83% 63%' },
  purple: { primary: '262 83% 58%', glow: '262 83% 68%' },
  orange: { primary: '25 95% 53%', glow: '25 95% 63%' },
  red: { primary: '0 84% 60%', glow: '0 84% 70%' },
  cyan: { primary: '190 90% 50%', glow: '190 90% 60%' },
  teal: { primary: '168 76% 42%', glow: '168 76% 52%' },
  pink: { primary: '330 81% 60%', glow: '330 81% 70%' },
};

// Font presetleri
const FONT_PRESETS: Record<string, { family: string; import: string }> = {
  inter: {
    family: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Inter:wght@300;400;500;600;700;800',
  },
  poppins: {
    family: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Poppins:wght@300;400;500;600;700;800',
  },
  roboto: {
    family: "'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Roboto:wght@300;400;500;700;900',
  },
  nunito: {
    family: "'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Nunito:wght@300;400;500;600;700;800',
  },
  montserrat: {
    family: "'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Montserrat:wght@300;400;500;600;700;800',
  },
  openSans: {
    family: "'Open Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Open+Sans:wght@300;400;500;600;700;800',
  },
  lato: {
    family: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Lato:wght@300;400;700;900',
  },
  sourceSans: {
    family: "'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    import: 'Source+Sans+3:wght@300;400;500;600;700;800',
  },
};

// Font weight presetleri
const FONT_WEIGHT_PRESETS: Record<string, string> = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
};

// Letter spacing presetleri
const LETTER_SPACING_PRESETS: Record<string, string> = {
  tight: '-0.025em',
  normal: '0',
  wide: '0.025em',
};

// Border radius presetleri
const RADIUS_PRESETS: Record<string, string> = {
  none: '0',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  full: '9999px',
};

// Shadow presetleri
const SHADOW_PRESETS: Record<string, { card: string; elegant: string }> = {
  none: {
    card: 'none',
    elegant: 'none',
  },
  soft: {
    card: '0 2px 8px -2px hsl(222 47% 11% / 0.05)',
    elegant: '0 4px 15px -5px hsl(var(--primary) / 0.1)',
  },
  normal: {
    card: '0 4px 20px -4px hsl(222 47% 11% / 0.1)',
    elegant: '0 10px 30px -10px hsl(var(--primary) / 0.2)',
  },
  strong: {
    card: '0 8px 30px -6px hsl(222 47% 11% / 0.15)',
    elegant: '0 15px 40px -12px hsl(var(--primary) / 0.3)',
  },
  dramatic: {
    card: '0 12px 40px -8px hsl(222 47% 11% / 0.2)',
    elegant: '0 20px 50px -15px hsl(var(--primary) / 0.4)',
  },
};

// Background tone presetleri
const BACKGROUND_TONE_PRESETS: Record<
  string,
  { light: { background: string; card: string }; dark: { background: string; card: string } }
> = {
  neutral: {
    light: { background: '210 25% 98%', card: '0 0% 100%' },
    dark: { background: '222 47% 11%', card: '220 26% 14%' },
  },
  warm: {
    light: { background: '30 25% 98%', card: '30 20% 100%' },
    dark: { background: '20 30% 10%', card: '20 25% 13%' },
  },
  cool: {
    light: { background: '220 25% 98%', card: '220 20% 100%' },
    dark: { background: '230 40% 10%', card: '230 35% 13%' },
  },
  slate: {
    light: { background: '215 20% 96%', card: '210 15% 99%' },
    dark: { background: '215 25% 9%', card: '215 20% 12%' },
  },
};

// Card style presetleri
const CARD_STYLE_PRESETS: Record<
  string,
  { background: string; backdrop: string; border: string; shadow: string }
> = {
  default: {
    background: 'hsl(var(--card))',
    backdrop: 'none',
    border: '1px solid hsl(var(--border))',
    shadow: 'var(--shadow-card)',
  },
  glass: {
    background: 'hsl(var(--card) / 0.8)',
    backdrop: 'blur(12px)',
    border: '1px solid hsl(var(--border) / 0.5)',
    shadow: 'var(--shadow-card)',
  },
  flat: {
    background: 'hsl(var(--card))',
    backdrop: 'none',
    border: 'none',
    shadow: 'none',
  },
  elevated: {
    background: 'hsl(var(--card))',
    backdrop: 'none',
    border: '1px solid hsl(var(--border) / 0.3)',
    shadow: '0 8px 30px -6px hsl(var(--foreground) / 0.12)',
  },
};

// Border style presetleri
const BORDER_STYLE_PRESETS: Record<string, { width: string; opacity: string }> = {
  none: { width: '0', opacity: '0' },
  subtle: { width: '1px', opacity: '0.3' },
  normal: { width: '1px', opacity: '1' },
  strong: { width: '2px', opacity: '1' },
};

// Animation speed presetleri
const ANIMATION_SPEED_PRESETS: Record<string, { duration: string; easing: string }> = {
  none: { duration: '0ms', easing: 'linear' },
  fast: { duration: '150ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  normal: { duration: '300ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
  slow: { duration: '500ms', easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
};

// Chart palette presetleri
const CHART_PALETTE_PRESETS: Record<string, string[]> = {
  default: ['142 76% 36%', '221 83% 53%', '262 83% 58%', '142 71% 45%', '45 93% 58%'],
  warm: ['25 95% 53%', '0 84% 60%', '330 81% 60%', '45 93% 58%', '15 90% 55%'],
  cool: ['221 83% 53%', '190 90% 50%', '262 83% 58%', '168 76% 42%', '200 80% 55%'],
  monochrome: ['222 47% 20%', '222 47% 35%', '222 47% 50%', '222 47% 65%', '222 47% 80%'],
  vibrant: ['0 84% 60%', '45 93% 58%', '142 76% 36%', '221 83% 53%', '262 83% 58%'],
};

// Default değerler
const DEFAULTS = {
  primary: '142 76% 36%',
  primaryGlow: '142 71% 45%',
  accent: '142 76% 36%',
  success: '142 76% 36%',
  destructive: '0 84% 60%',
  secondary: '220 14% 96%',
  muted: '210 20% 96%',
  mutedForeground: '215 16% 47%',
  navy: '222 47% 11%',
  navyLight: '220 26% 14%',
  font: 'inter',
  fontWeight: 'normal',
  letterSpacing: 'normal',
  radius: 'lg',
  shadow: 'normal',
  backgroundTone: 'neutral',
  cardStyle: 'default',
  borderStyle: 'normal',
  animationSpeed: 'normal',
  chartPalette: 'default',
  darkBackground: '222 47% 11%',
  darkCard: '220 26% 14%',
  darkMuted: '217 33% 17%',
  darkBorder: '217 33% 17%',
};

// Font yükleyici - Google Fonts'tan dinamik font yükler
function loadGoogleFont(fontImport: string) {
  const linkId = `google-font-${fontImport.split(':')[0]}`;

  // Zaten yüklüyse tekrar yükleme
  if (document.getElementById(linkId)) return;

  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${fontImport}&display=swap`;
  document.head.appendChild(link);
}

/**
 * Site ayarlarından tema renklerini ve stil ayarlarını çeker ve CSS değişkenlerine uygular
 */
export function useThemeColors() {
  // Site ayarlarını çek - Renkler
  const { data: enabledSetting } = useGetSiteSettingByKeyQuery('theme_colors_enabled');
  const { data: presetSetting } = useGetSiteSettingByKeyQuery('theme_color_preset');
  const { data: primarySetting } = useGetSiteSettingByKeyQuery('theme_primary_hsl');
  const { data: glowSetting } = useGetSiteSettingByKeyQuery('theme_primary_glow_hsl');
  const { data: accentSetting } = useGetSiteSettingByKeyQuery('theme_accent_hsl');
  const { data: successSetting } = useGetSiteSettingByKeyQuery('theme_success_hsl');
  const { data: destructiveSetting } = useGetSiteSettingByKeyQuery('theme_destructive_hsl');
  const { data: secondarySetting } = useGetSiteSettingByKeyQuery('theme_secondary_hsl');
  const { data: mutedSetting } = useGetSiteSettingByKeyQuery('theme_muted_hsl');
  const { data: mutedForegroundSetting } = useGetSiteSettingByKeyQuery('theme_muted_foreground_hsl');

  // Site ayarlarını çek - Font
  const { data: fontSetting } = useGetSiteSettingByKeyQuery('theme_font_preset');
  const { data: fontWeightSetting } = useGetSiteSettingByKeyQuery('theme_font_weight_preset');
  const { data: letterSpacingSetting } = useGetSiteSettingByKeyQuery('theme_letter_spacing_preset');

  // Site ayarlarını çek - Stil
  const { data: radiusSetting } = useGetSiteSettingByKeyQuery('theme_radius_preset');
  const { data: shadowSetting } = useGetSiteSettingByKeyQuery('theme_shadow_preset');
  const { data: backgroundToneSetting } = useGetSiteSettingByKeyQuery(
    'theme_background_tone_preset',
  );
  const { data: cardStyleSetting } = useGetSiteSettingByKeyQuery('theme_card_style_preset');
  const { data: borderStyleSetting } = useGetSiteSettingByKeyQuery('theme_border_style_preset');
  const { data: animationSpeedSetting } = useGetSiteSettingByKeyQuery(
    'theme_animation_speed_preset',
  );

  // Site ayarlarını çek - Navy/Hero
  const { data: navySetting } = useGetSiteSettingByKeyQuery('theme_navy_hsl');
  const { data: navyLightSetting } = useGetSiteSettingByKeyQuery('theme_navy_light_hsl');

  // Site ayarlarını çek - Chart
  const { data: chartPaletteSetting } = useGetSiteSettingByKeyQuery('theme_chart_palette_preset');

  // Site ayarlarını çek - Dark Mode
  const { data: darkBackgroundSetting } = useGetSiteSettingByKeyQuery('theme_dark_background_hsl');
  const { data: darkCardSetting } = useGetSiteSettingByKeyQuery('theme_dark_card_hsl');
  const { data: darkMutedSetting } = useGetSiteSettingByKeyQuery('theme_dark_muted_hsl');
  const { data: darkBorderSetting } = useGetSiteSettingByKeyQuery('theme_dark_border_hsl');

  // Renk değerlerini hesapla
  const colors = useMemo(() => {
    const isEnabled = enabledSetting?.value !== 'false';
    if (!isEnabled) return null;

    const preset = (presetSetting?.value as string) || 'green';

    // Custom preset ise ayarlardan al, değilse preset'ten al
    if (preset === 'custom') {
      return {
        primary: (primarySetting?.value as string) || DEFAULTS.primary,
        primaryGlow: (glowSetting?.value as string) || DEFAULTS.primaryGlow,
        accent: (accentSetting?.value as string) || DEFAULTS.accent,
        success: (successSetting?.value as string) || DEFAULTS.success,
        destructive: (destructiveSetting?.value as string) || DEFAULTS.destructive,
        secondary: (secondarySetting?.value as string) || DEFAULTS.secondary,
        muted: (mutedSetting?.value as string) || DEFAULTS.muted,
        mutedForeground: (mutedForegroundSetting?.value as string) || DEFAULTS.mutedForeground,
        navy: (navySetting?.value as string) || DEFAULTS.navy,
        navyLight: (navyLightSetting?.value as string) || DEFAULTS.navyLight,
      };
    }

    // Preset renk kullan
    const presetColors = COLOR_PRESETS[preset] ?? { primary: DEFAULTS.primary, glow: DEFAULTS.primaryGlow };
    return {
      primary: presetColors.primary,
      primaryGlow: presetColors.glow,
      accent: presetColors.primary,
      success: presetColors.primary,
      destructive: DEFAULTS.destructive,
      secondary: (secondarySetting?.value as string) || DEFAULTS.secondary,
      muted: (mutedSetting?.value as string) || DEFAULTS.muted,
      mutedForeground: (mutedForegroundSetting?.value as string) || DEFAULTS.mutedForeground,
      navy: (navySetting?.value as string) || DEFAULTS.navy,
      navyLight: (navyLightSetting?.value as string) || DEFAULTS.navyLight,
    };
  }, [
    enabledSetting?.value,
    presetSetting?.value,
    primarySetting?.value,
    glowSetting?.value,
    accentSetting?.value,
    successSetting?.value,
    destructiveSetting?.value,
    secondarySetting?.value,
    mutedSetting?.value,
    mutedForegroundSetting?.value,
    navySetting?.value,
    navyLightSetting?.value,
  ]);

  // Stil ayarlarını hesapla
  const styles = useMemo(() => {
    const isEnabled = enabledSetting?.value !== 'false';
    if (!isEnabled) return null;

    const fontPreset = (fontSetting?.value as string) || DEFAULTS.font;
    const fontWeightPreset = (fontWeightSetting?.value as string) || DEFAULTS.fontWeight;
    const letterSpacingPreset = (letterSpacingSetting?.value as string) || DEFAULTS.letterSpacing;
    const radiusPreset = (radiusSetting?.value as string) || DEFAULTS.radius;
    const shadowPreset = (shadowSetting?.value as string) || DEFAULTS.shadow;
    const backgroundTonePreset =
      (backgroundToneSetting?.value as string) || DEFAULTS.backgroundTone;
    const cardStylePreset = (cardStyleSetting?.value as string) || DEFAULTS.cardStyle;
    const borderStylePreset = (borderStyleSetting?.value as string) || DEFAULTS.borderStyle;
    const animationSpeedPreset =
      (animationSpeedSetting?.value as string) || DEFAULTS.animationSpeed;
    const chartPalettePreset = (chartPaletteSetting?.value as string) || DEFAULTS.chartPalette;

    // Fallback değerleri
    const fontData = FONT_PRESETS[fontPreset] ?? FONT_PRESETS.inter!;
    const fontWeightValue = FONT_WEIGHT_PRESETS[fontWeightPreset] ?? '400';
    const letterSpacingValue = LETTER_SPACING_PRESETS[letterSpacingPreset] ?? '0';
    const radiusValue = RADIUS_PRESETS[radiusPreset] ?? '0.75rem';
    const shadowData = SHADOW_PRESETS[shadowPreset] ?? SHADOW_PRESETS.normal!;
    const backgroundToneData = BACKGROUND_TONE_PRESETS[backgroundTonePreset] ?? BACKGROUND_TONE_PRESETS.neutral!;
    const cardStyleData = CARD_STYLE_PRESETS[cardStylePreset] ?? CARD_STYLE_PRESETS.default!;
    const borderStyleData = BORDER_STYLE_PRESETS[borderStylePreset] ?? BORDER_STYLE_PRESETS.normal!;
    const animationSpeedData = ANIMATION_SPEED_PRESETS[animationSpeedPreset] ?? ANIMATION_SPEED_PRESETS.normal!;
    const chartPaletteData = CHART_PALETTE_PRESETS[chartPalettePreset] ?? CHART_PALETTE_PRESETS.default!;

    return {
      font: fontData,
      fontPreset,
      fontWeight: fontWeightValue,
      fontWeightPreset,
      letterSpacing: letterSpacingValue,
      letterSpacingPreset,
      radius: radiusValue,
      radiusPreset,
      shadow: shadowData,
      shadowPreset,
      backgroundTone: backgroundToneData,
      backgroundTonePreset,
      cardStyle: cardStyleData,
      cardStylePreset,
      borderStyle: borderStyleData,
      borderStylePreset,
      animationSpeed: animationSpeedData,
      animationSpeedPreset,
      chartPalette: chartPaletteData,
      chartPalettePreset,
    };
  }, [
    enabledSetting?.value,
    fontSetting?.value,
    fontWeightSetting?.value,
    letterSpacingSetting?.value,
    radiusSetting?.value,
    shadowSetting?.value,
    backgroundToneSetting?.value,
    cardStyleSetting?.value,
    borderStyleSetting?.value,
    animationSpeedSetting?.value,
    chartPaletteSetting?.value,
  ]);

  // Dark mode ayarlarını hesapla
  const darkMode = useMemo(() => {
    const isEnabled = enabledSetting?.value !== 'false';
    if (!isEnabled) return null;

    return {
      background: (darkBackgroundSetting?.value as string) || DEFAULTS.darkBackground,
      card: (darkCardSetting?.value as string) || DEFAULTS.darkCard,
      muted: (darkMutedSetting?.value as string) || DEFAULTS.darkMuted,
      border: (darkBorderSetting?.value as string) || DEFAULTS.darkBorder,
    };
  }, [
    enabledSetting?.value,
    darkBackgroundSetting?.value,
    darkCardSetting?.value,
    darkMutedSetting?.value,
    darkBorderSetting?.value,
  ]);

  // Tüm CSS değişkenlerini tek bir style tag ile uygula
  useEffect(() => {
    if (!colors || !styles) return;

    // Font yükle
    loadGoogleFont(styles.font.import);

    // Style tag oluştur veya mevcut olanı al
    const styleId = 'theme-dynamic-vars';
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    // Chart colors CSS
    const chartColorsCSS = styles.chartPalette
      .map((color, index) => `--chart-${index + 1}: ${color};`)
      .join('\n        ');

    // Dark mode değerleri
    const darkBg = darkMode?.background ?? DEFAULTS.darkBackground;
    const darkCard = darkMode?.card ?? DEFAULTS.darkCard;
    const darkMuted = darkMode?.muted ?? DEFAULTS.darkMuted;
    const darkBorder = darkMode?.border ?? DEFAULTS.darkBorder;

    // CSS içeriğini oluştur - hem :root hem .dark için
    styleEl.textContent = `
      :root {
        /* Renkler */
        --primary: ${colors.primary};
        --primary-glow: ${colors.primaryGlow};
        --accent: ${colors.accent};
        --success: ${colors.success};
        --ring: ${colors.primary};
        --secondary: ${colors.secondary};
        --muted: ${colors.muted};
        --muted-foreground: ${colors.mutedForeground};
        --navy: ${colors.navy};
        --navy-light: ${colors.navyLight};
        --destructive: ${colors.destructive};

        /* Gradientler */
        --gradient-primary: linear-gradient(135deg, hsl(${colors.primary}), hsl(${colors.primaryGlow}));
        --gradient-hero: linear-gradient(135deg, hsl(${colors.navy}), hsl(${colors.navyLight}));

        /* Font */
        --font-family: ${styles.font.family};
        --font-weight-base: ${styles.fontWeight};
        --letter-spacing-base: ${styles.letterSpacing};

        /* Border Radius */
        --radius: ${styles.radius};

        /* Shadows */
        --shadow-card: ${styles.shadow.card};
        --shadow-elegant: ${styles.shadow.elegant};

        /* Background & Card (Light) */
        --background: ${styles.backgroundTone.light.background};
        --card: ${styles.backgroundTone.light.card};

        /* Card Style */
        --card-background: ${styles.cardStyle.background};
        --card-backdrop: ${styles.cardStyle.backdrop};
        --card-border: ${styles.cardStyle.border};
        --card-shadow: ${styles.cardStyle.shadow};

        /* Border Style */
        --border-width: ${styles.borderStyle.width};
        --border-opacity: ${styles.borderStyle.opacity};

        /* Animation */
        --transition-duration: ${styles.animationSpeed.duration};
        --transition-easing: ${styles.animationSpeed.easing};
        --transition-smooth: all ${styles.animationSpeed.duration} ${styles.animationSpeed.easing};

        /* Chart Colors */
        ${chartColorsCSS}
      }

      .dark {
        --background: ${darkBg};
        --card: ${darkCard};
        --popover: ${darkCard};
        --muted: ${darkMuted};
        --border: ${darkBorder};
        --input: ${darkBorder};

        /* Dark mode için gradient güncelleme */
        --gradient-hero: linear-gradient(135deg, hsl(${darkCard}), hsl(${darkBg}));
      }
    `;

    // Body'ye font uygula
    document.body.style.fontFamily = styles.font.family;

    // Cleanup
    return () => {
      // Style tag'i kaldırma - başka effect'ler de kullanıyor olabilir
    };
  }, [colors, styles, darkMode]);

  return {
    colors,
    styles,
    darkMode,
    presets: {
      colors: COLOR_PRESETS,
      fonts: FONT_PRESETS,
      fontWeights: FONT_WEIGHT_PRESETS,
      letterSpacing: LETTER_SPACING_PRESETS,
      radius: RADIUS_PRESETS,
      shadows: SHADOW_PRESETS,
      backgroundTones: BACKGROUND_TONE_PRESETS,
      cardStyles: CARD_STYLE_PRESETS,
      borderStyles: BORDER_STYLE_PRESETS,
      animationSpeeds: ANIMATION_SPEED_PRESETS,
      chartPalettes: CHART_PALETTE_PRESETS,
    },
    isEnabled: enabledSetting?.value !== 'false',
  };
}

export default useThemeColors;
