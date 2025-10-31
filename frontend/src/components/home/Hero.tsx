import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { useNavigate } from "react-router-dom";

interface Category {
  id: string;
  name: string;
  slug: string;
  image_url: string | null;
  icon: string | null;
  description?: string | null;
}

const toBool = (v: unknown) =>
  v === true || v === 1 || v === "1" || String(v).toLowerCase() === "true" || v === "on";

const Hero = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState({
    home_header_top_text: "İndirim Sezonu Başladı",
    home_header_bottom_text:
      "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
    home_header_sub_text_1: "Yeni Üyelere Özel",
    home_header_sub_text_2: "%10 Fırsatı Dijimin'de!",
    home_header_button_text: "Ürünleri İncele",
    home_header_show_contact: true as boolean | string,
    home_hero_image_url: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchCategories();

    // Realtime (varsa) — hata alsa bile UI’yi bozmasın
    try {
      const channel = (metahub as any)
        ?.channel?.("home-settings-changes")
        ?.on?.(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "site_settings" },
          (payload: any) => {
            const keys = [
              "home_header_top_text",
              "home_header_bottom_text",
              "home_header_sub_text_1",
              "home_header_sub_text_2",
              "home_header_button_text",
              "home_header_show_contact",
              "home_hero_image_url",
            ];
            if (keys.includes(payload?.new?.key)) fetchSettings();
          }
        )
        ?.on?.(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "site_settings" },
          (payload: any) => {
            const keys = [
              "home_header_top_text",
              "home_header_bottom_text",
              "home_header_sub_text_1",
              "home_header_sub_text_2",
              "home_header_button_text",
              "home_header_show_contact",
              "home_hero_image_url",
            ];
            if (keys.includes(payload?.new?.key)) fetchSettings();
          }
        )
        ?.subscribe?.();

      return () => {
        try {
          (metahub as any)?.removeChannel?.(channel);
        } catch {/* ignore */}
      };
    } catch {/* ignore */}
  }, []);

  const fetchCategories = async () => {
    try {
      // Boolean/tinyint/string uyumu için geniş filtre:
      const { data, error } = await metahub
        .from("categories")
        .select("id, name, slug, image_url, icon, description")
        .eq("is_active", true)
        .in("is_featured", [true, 1, "1", "true"]) // prod’daki olası formatlar
        .limit(1);

      if (error) throw error;

      // Fallback: featured yoksa ilk aktif kategoriye düş
      if (!data || data.length === 0) {
        const alt = await metahub
          .from("categories")
          .select("id, name, slug, image_url, icon, description")
          .eq("is_active", true)
          .order("display_order", { ascending: true })
          .limit(1);

        setCategories(Array.isArray(alt?.data) ? alt.data : []);
        return;
      }

      setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      setCategories([]); // UI her durumda render etsin
    }
  };

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", [
          "home_header_top_text",
          "home_header_bottom_text",
          "home_header_sub_text_1",
          "home_header_sub_text_2",
          "home_header_button_text",
          "home_header_show_contact",
          "home_hero_image_url",
        ]);

      if (error) throw error;

      if (Array.isArray(data) && data.length > 0) {
        const obj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});
        setSettings((prev) => ({ ...prev, ...obj }));
      }
    } catch (error) {
      console.error("Error fetching home settings:", error);
    }
  };

  const category = categories[0];
  const showContact = toBool(settings.home_header_show_contact);
  const heroImg = settings.home_hero_image_url || category?.image_url;

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="relative min-h-[600px] md:min_h-[700px] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {heroImg ? (
            <>
              <img src={heroImg} alt="Hero Background" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30" />
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          )}
        </div>

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl space-y-6 md:space-y-8 py-12 md:py-20">
            <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-md text-primary px-6 py-3 rounded-full text-sm font-bold border-2 border-primary/20 shadow-lg animate-fade-in">
              <Sparkles className="w-5 h-5 animate-pulse" />
              {settings.home_header_top_text}
            </div>

            <h1
              className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight animate-fade-in"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="block mb-3">{settings.home_header_sub_text_1}</span>
              <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                {settings.home_header_sub_text_2}
              </span>
            </h1>

            <p
              className="text-lg md:text-xl text-foreground/80 font-light leading-relaxed animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            >
              {settings.home_header_bottom_text}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/50 transition-all text-base px-10 h-14 rounded-full font-bold group"
                onClick={() =>
                  navigate(category?.slug ? `/kategoriler/${category.slug}` : "/urunler")
                }
              >
                {settings.home_header_button_text}
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Button>

              {showContact && (
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-primary/20 hover:bg-primary/5 text-base px-10 h-14 rounded-full font-bold backdrop-blur-sm"
                  onClick={() => (window.location.href = "/iletisim")}
                >
                  İletişime Geç
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decorative */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div
        className="absolute bottom-20 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse pointer-events-none"
        style={{ animationDelay: "1s" }}
      />
    </section>
  );
};

export default Hero;
