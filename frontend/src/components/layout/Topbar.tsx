// =============================================================
// FILE: src/components/layout/Topbar.tsx
// =============================================================
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import {
  useGetActiveTopbarQuery,
} from "@/integrations/hooks";

export const Topbar = () => {
  const { data: settings, isFetching, isError } = useGetActiveTopbarQuery();
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const location = useLocation();

  // Admin sayfalarında gösterme
  if (location.pathname.startsWith("/admin")) return null;

  // Hata, yükleme, kayıt yok, pasif, kapatılmış ise gösterme
  if (
    isError ||
    isFetching ||
    !settings ||
    !settings.is_active ||
    !isVisible
  ) {
    return null;
  }

  // Kuponu topbarda göstermiyoruz; sadece linke query olarak ekleyebiliriz
  const hasCoupon = !!settings.coupon_code;
  const hasLink = !!settings.link_url;

  const linkHref = (() => {
    if (!hasLink) return undefined;
    if (!hasCoupon) return settings.link_url!;
    const base = settings.link_url!;
    const sep = base.includes("?") ? "&" : "?";
    return `${base}${sep}coupon=${encodeURIComponent(
      settings.coupon_code!,
    )}`;
  })();

  const handleClose = () => setIsVisible(false);

  const showTicker = !!settings.show_ticker;

  return (
    <>
      {/* Çok hafif global CSS: sadece topbar kaydırma animasyonu */}
      {showTicker && (
        <style>
          {`
            @keyframes topbar-marquee {
              0% { transform: translateX(100%); }
              100% { transform: translateX(-100%); }
            }
            .topbar-marquee-inner {
              display: inline-block;
              white-space: nowrap;
              padding-left: 100%;
              animation: topbar-marquee 18s linear infinite;
            }
          `}
        </style>
      )}

      <div className="relative w-full py-2 px-4 text-sm font-medium bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-center gap-4 flex-wrap">
          {/* Mesaj alanı */}
          <div className={showTicker ? "overflow-hidden flex-1" : "flex-1 text-center"}>
            {showTicker ? (
              <div className="topbar-marquee-inner">
                {settings.message}
              </div>
            ) : (
              <span>{settings.message}</span>
            )}
          </div>

          {/* Detay linki (kupon kodu query ile gider, ama bar’da görünmez) */}
          {linkHref && (
            <a
              href={linkHref}
              className="inline-flex items-center px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors underline"
            >
              {settings.link_text || "Detaylar"}
            </a>
          )}

          {/* Kapat butonu */}
          <button
            onClick={handleClose}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="Kapat"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
};
