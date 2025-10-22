import { useState, useEffect } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "react-router-dom";

interface TopbarSettings {
  id: string;
  is_active: boolean;
  message: string;
  coupon_code?: string;
  link_url?: string;
  link_text?: string;
}

export const Topbar = () => {
  const [settings, setSettings] = useState<TopbarSettings | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();
  const location = useLocation();

  useEffect(() => {
    fetchTopbarSettings();
  }, []);

  const fetchTopbarSettings = async () => {
    const { data, error } = await metahub
      .from("topbar_settings")
      .select("*")
      .eq("is_active", true)
      .maybeSingle();

    if (error) {
      console.error("Error fetching topbar:", error);
      return;
    }

    setSettings(data);
  };

  const handleCopyCoupon = async () => {
    if (!settings?.coupon_code) return;

    try {
      await navigator.clipboard.writeText(settings.coupon_code);
      toast({
        title: "Kupon kodu kopyalandı!",
        description: settings.coupon_code,
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  // Don't show on admin pages
  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  if (!settings || !isVisible) {
    return null;
  }

  return (
    <div
      className="relative w-full py-2 px-4 text-center text-sm font-medium bg-primary text-primary-foreground"
    >
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
