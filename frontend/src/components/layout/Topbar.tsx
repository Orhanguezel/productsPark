// =============================================================
// FILE: src/components/layout/Topbar.tsx
// =============================================================
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useGetActiveTopbarQuery } from "@/integrations/hooks";

export const Topbar = () => {
  const { data: settings, isFetching, isError } = useGetActiveTopbarQuery();
  const [isVisible, setIsVisible] = useState(true);
  const location = useLocation();

  // Admin sayfalarında gösterme
  if (location.pathname.startsWith("/admin")) return null;

  // Hata, yükleme, kayıt yok, pasif, kapatılmış ise gösterme
  if (isError || isFetching || !settings || !settings.is_active || !isVisible) {
    return null;
  }

  const hasCoupon = !!settings.coupon_code;
  const hasLink   = !!settings.link_url;
  const showTicker = !!settings.show_ticker;

  // Link href: kupon varsa query param olarak ekle
  const linkHref = (() => {
    if (!hasLink) return null;
    if (!hasCoupon) return settings.link_url!;
    const base = settings.link_url!;
    const sep  = base.includes("?") ? "&" : "?";
    return `${base}${sep}coupon=${encodeURIComponent(settings.coupon_code!)}`;
  })();

  // İç link mi dış link mi?
  const isInternal = linkHref?.startsWith("/");

  const linkLabel = settings.link_text || "Şimdi Kaydol";

  return (
    <>
      {showTicker && (
        <style>{`
          @keyframes topbar-marquee {
            0%   { transform: translateX(0); }
            100% { transform: translateX(-100%); }
          }
          .topbar-marquee-inner {
            display: inline-block;
            white-space: nowrap;
            padding-left: 100%;
            animation: topbar-marquee 18s linear infinite;
          }
        `}</style>
      )}

      <div className="relative w-full py-2 px-4 text-sm font-medium bg-primary text-primary-foreground">
        <div className="container mx-auto flex items-center justify-center gap-3 flex-wrap">

          {/* Mesaj */}
          <div className={showTicker ? "overflow-hidden flex-1" : "flex-1 text-center"}>
            {showTicker ? (
              <div className="topbar-marquee-inner">{settings.message}</div>
            ) : (
              <span>{settings.message}</span>
            )}
          </div>

          {/* Kupon kodu badge */}
          {hasCoupon && (
            <span className="shrink-0 px-2 py-0.5 rounded bg-white/20 font-mono text-xs font-semibold tracking-wider">
              {settings.coupon_code}
            </span>
          )}

          {/* Link butonu */}
          {linkHref && (
            isInternal ? (
              <Link
                to={linkHref}
                className="shrink-0 inline-flex items-center px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors text-primary-foreground font-semibold"
              >
                {linkLabel}
              </Link>
            ) : (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors font-semibold"
              >
                {linkLabel}
              </a>
            )
          )}

          {/* Kapat */}
          <button
            onClick={() => setIsVisible(false)}
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
