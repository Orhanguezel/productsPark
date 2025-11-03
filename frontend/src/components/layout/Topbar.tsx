// =============================================================
// FILE: src/components/layout/Topbar.tsx
// =============================================================
"use client";
import { useState } from "react";
import { Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button"; // (isteğe bağlı, sadece stil için)
import {
  useGetActiveTopbarQuery,
} from "@/integrations/metahub/rtk/endpoints/topbar_settings.endpoints";

export const Topbar = () => {
  const { data: settings, isFetching, isError } = useGetActiveTopbarQuery();
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const location = useLocation();

  // Admin sayfalarında gösterme
  if (location.pathname.startsWith("/admin")) return null;

  // Hata, yükleme veya görünür değilse gösterme
  if (isError || isFetching || !settings || !settings.is_active || !isVisible) return null;

  const handleCopyCoupon = async () => {
    if (!settings?.coupon_code) return;
    try {
      await navigator.clipboard.writeText(settings.coupon_code);
      toast({
        title: "Kupon kodu kopyalandı!",
        description: settings.coupon_code,
      });
    } catch (err) {
      // sessizce yut
      // console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => setIsVisible(false);

  return (
    <div className="relative w-full py-2 px-4 text-center text-sm font-medium bg-primary text-primary-foreground">
      <div className="container mx-auto flex items-center justify-center gap-4 flex-wrap">
        <span>{settings.message}</span>

        {settings.coupon_code && (
          <button
            onClick={handleCopyCoupon}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors"
          >
            <span className="font-bold">{settings.coupon_code}</span>
            <Copy className="h-3 w-3" />
          </button>
        )}

        {settings.link_url && settings.link_text && (
          <a
            href={settings.link_url}
            className="inline-flex items-center px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 transition-colors underline"
          >
            {settings.link_text}
          </a>
        )}

        <button
          onClick={handleClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded transition-colors"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
