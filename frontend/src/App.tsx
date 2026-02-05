// =============================================================
// FILE: src/App.tsx
// FINAL — App root
// - GlobalSeo: head (robots, favicon, OG/Twitter, GA/GTM head, schema)
// - RouteSeoLinks: canonical + hreflang (route-aware)
// - GTM noscript in body
// - custom_footer_code executed at body end (FooterCodeRenderer)
// =============================================================

import { Suspense, useMemo } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from 'next-themes';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

import { useMaintenanceMode } from '@/hooks/useMaintenanceMode';
import { useThemeColors } from '@/hooks/useThemeColors';
import { MaintenanceMode } from '@/components/MaintenanceMode';
import LoadingSpinner from '@/components/ui/loading-spinner';

import { FakeOrderNotification } from './components/FakeOrderNotification';
import { GlobalSeo } from '@/seo/GlobalSeo';
import { RouteSeoLinks } from '@/seo/RouteSeoLinks';
import { FooterCodeRenderer } from '@/seo/FooterCodeRenderer';

import { CampaignPopup } from './components/CampaignPopup';
import { CartDrawer } from './components/CartDrawer';
import AppRoutes from '@/routes/AppRoutes';

import { useSeoMetaQuery } from '@/integrations/rtk/public/seo.endpoints';

const queryClient = new QueryClient();

const isValidGtmId = (v: string) => /^GTM-[A-Z0-9]+$/i.test(v.trim());
const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

const AppShell: React.FC<React.PropsWithChildren> = ({ children }) => {
  // ✅ single source: /seo/meta
  const { data } = useSeoMetaQuery();

  const gtmIdRaw = toStr(data?.analytics_gtm_id).trim();
  const gtmId = isValidGtmId(gtmIdRaw) ? gtmIdRaw : '';

  const gtmNsSrc = useMemo(() => {
    if (!gtmId) return '';
    return `https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(gtmId)}`;
  }, [gtmId]);

  const footerHtml = toStr(data?.custom_footer_code);

  return (
    <div data-app className="min-h-screen bg-background text-foreground">
      {/* GTM noscript -> body içinde en doğru yer */}
      {gtmId ? (
        <noscript>
          <iframe
            src={gtmNsSrc}
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
            title="gtm"
          />
        </noscript>
      ) : null}

      {children}

      {/* ✅ custom_footer_code: body end execute */}
      {footerHtml.trim() ? <FooterCodeRenderer html={footerHtml} /> : null}

      <div id="radix-portal-root" />
    </div>
  );
};

const AppContent = () => {
  const { shouldShowMaintenance, loading } = useMaintenanceMode();

  // Dinamik tema renklerini uygula
  useThemeColors();

  if (loading) return <LoadingSpinner />;
  if (shouldShowMaintenance) return <MaintenanceMode />;

  return (
    <>
      {/* Global UI */}
      <Toaster />
      <Sonner />
      <FakeOrderNotification />

      {/* Global SEO (head scripts/meta) */}
      <GlobalSeo />

      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        {/* canonical + hreflang route-aware */}
        <RouteSeoLinks />

        <AppShell>
          <CartDrawer />
          <CampaignPopup />

          <Suspense fallback={<LoadingSpinner />}>
            <AppRoutes />
          </Suspense>
        </AppShell>
      </BrowserRouter>
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <HelmetProvider>
            <AppContent />
          </HelmetProvider>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
