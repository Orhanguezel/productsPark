import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { metahub } from "@/integrations/metahub/client";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export const CampaignPopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPopup, setCurrentPopup] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Admin sayfalarında popup gösterme
  const isAdminPage = location.pathname.startsWith("/admin");

  const { data: popups } = useQuery({
    queryKey: ["active-popups"],
    queryFn: async () => {
      const { data, error } = await metahub
        .from("popups")
        .select("*, products(id, name, slug, image_url, price, original_price)")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !isAdminPage,
  });

  useEffect(() => {
    if (!popups || popups.length === 0 || isAdminPage) return;

    const checkAndShowPopup = () => {
      const currentPath = location.pathname;

      for (const popup of popups) {
        // Check if popup should be shown on current page
        const shouldShow =
          popup.display_pages === "all" ||
          (popup.display_pages === "home" && currentPath === "/") ||
          (popup.display_pages === "products" && currentPath.includes("/urun")) ||
          (popup.display_pages === "categories" && currentPath.includes("/kategoriler"));

        if (!shouldShow) continue;

        // Check frequency
        const cookieKey = `popup_seen_${popup.id}`;
        const lastSeen = localStorage.getItem(cookieKey);

        let canShow = false;

        if (popup.display_frequency === "always") {
          canShow = true;
        } else if (popup.display_frequency === "once" && !lastSeen) {
          canShow = true;
        } else if (popup.display_frequency === "daily" && lastSeen) {
          const daysSince = (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60 * 24);
          canShow = daysSince >= 1;
        } else if (popup.display_frequency === "weekly" && lastSeen) {
          const daysSince = (Date.now() - parseInt(lastSeen)) / (1000 * 60 * 60 * 24);
          canShow = daysSince >= 7;
        }

        if (canShow) {
          setCurrentPopup(popup);

          // Delay before showing popup
          const delayMs = (popup.delay_seconds || 2) * 1000;
          setTimeout(() => {
            setIsOpen(true);

            // Save last seen time
            if (popup.display_frequency !== "always") {
              localStorage.setItem(cookieKey, Date.now().toString());
            }

            // Auto close if duration is set
            if (popup.duration_seconds && popup.duration_seconds > 0) {
              setTimeout(() => {
                setIsOpen(false);
                setCurrentPopup(null);
              }, popup.duration_seconds * 1000);
            }
          }, delayMs);

          break; // Show only first matching popup
        }
      }
    };

    checkAndShowPopup();
  }, [popups, location.pathname, isAdminPage]);

  const handleClose = () => {
    setIsOpen(false);
    setCurrentPopup(null);
  };

  const handleCopyCoupon = () => {
    if (currentPopup?.coupon_code) {
      navigator.clipboard.writeText(currentPopup.coupon_code);
      setCopied(true);
      toast({
        title: "Kopyalandı!",
        description: "Kupon kodu kopyalandı.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleButtonClick = () => {
    if (currentPopup?.button_link) {
      if (currentPopup.button_link.startsWith("http")) {
        window.open(currentPopup.button_link, "_blank");
      } else {
        navigate(currentPopup.button_link);
      }
    } else if (currentPopup?.products) {
      navigate(`/urun/${currentPopup.products.slug}`);
    }
    handleClose();
  };

  if (!currentPopup || isAdminPage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <div className="relative">
          {currentPopup.image_url && (
            <div className="w-full h-64 overflow-hidden">
              <img
                src={currentPopup.image_url}
                alt={currentPopup.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                {currentPopup.title}
              </DialogTitle>
            </DialogHeader>

            <DialogDescription className="text-base whitespace-pre-wrap">
              {currentPopup.content}
            </DialogDescription>

            {/* Ürün Kartı */}
            {currentPopup.products && (
              <Card
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  navigate(`/urun/${currentPopup.products.slug}`);
                  handleClose();
                }}
              >
                <div className="flex gap-4">
                  {currentPopup.products.image_url && (
                    <img
                      src={currentPopup.products.image_url}
                      alt={currentPopup.products.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold mb-2">{currentPopup.products.name}</h3>
                    <div className="flex items-center gap-2">
                      {currentPopup.products.original_price && (
                        <span className="text-sm text-muted-foreground line-through">
                          {currentPopup.products.original_price} TL
                        </span>
                      )}
                      <span className="text-lg font-bold text-primary">
                        {currentPopup.products.price} TL
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Kupon Kodu */}
            {currentPopup.coupon_code && (
              <div className="bg-primary/10 border-2 border-primary/20 rounded-lg p-4">
                <p className="text-sm font-medium mb-2 text-center">Kupon Kodu</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-background border rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-primary font-mono tracking-wider">
                      {currentPopup.coupon_code}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={handleCopyCoupon}
                    className="h-12 w-12"
                  >
                    {copied ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              {(currentPopup.button_text || currentPopup.products) && (
                <Button onClick={handleButtonClick} className="flex-1">
                  {currentPopup.button_text || "Ürünü İncele"}
                </Button>
              )}
              <Button variant="outline" onClick={handleClose}>
                Kapat
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
