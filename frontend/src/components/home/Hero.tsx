// FILE: src/components/home/Hero.tsx
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type {
  Category,
  SiteSetting,
} from "@/integrations/types";
import {
  useListCategoriesQuery,
  useListSiteSettingsQuery,
} from "@/integrations/hooks";


const toBool = (v: unknown): boolean =>
  v === true ||
  v === 1 ||
  v === "1" ||
  String(v).toLowerCase() === "true" ||
  v === "on";

const DEFAULT_SETTINGS = {
  home_header_top_text: "İndirim Sezonu Başladı",
  home_header_bottom_text:
    "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  home_header_sub_text_1: "Yeni Üyelere Özel",
  home_header_sub_text_2: "%10 Fırsatı Dijimin'de!",
  home_header_button_text: "Ürünleri İncele",
  home_header_show_contact: true as boolean | string,
  home_hero_image_url: "",
};

type HeroSettings = typeof DEFAULT_SETTINGS;

const Hero = () => {
  const navigate = useNavigate();

  /* --------- Site settings (RTK) --------- */

  const { data: siteSettings } = useListSiteSettingsQuery({
    prefix: "home_",
  });

  const [settings, setSettings] = useState<HeroSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!siteSettings) return;

    setSettings((prev) => {
      const next: HeroSettings = { ...prev };
      const dict: Record<string, SiteSetting["value"]> = {};

      for (const item of siteSettings) {
        dict[item.key] = item.value;
      }

      // String olan ayarlar
      const stringKeys: Array<
        keyof Pick<
          HeroSettings,
          | "home_header_top_text"
          | "home_header_bottom_text"
          | "home_header_sub_text_1"
          | "home_header_sub_text_2"
          | "home_header_button_text"
          | "home_hero_image_url"
        >
      > = [
          "home_header_top_text",
          "home_header_bottom_text",
          "home_header_sub_text_1",
          "home_header_sub_text_2",
          "home_header_button_text",
          "home_hero_image_url",
        ];

      stringKeys.forEach((key) => {
        const raw = dict[key as string];
        if (typeof raw === "string") {
          next[key] = raw as HeroSettings[typeof key];
        }
      });

      // Contact gösterilsin mi?
      const showRaw = dict["home_header_show_contact"];
      if (typeof showRaw === "boolean" || typeof showRaw === "string") {
        next.home_header_show_contact = showRaw;
      }

      return next;
    });
  }, [siteSettings]);

  /* --------- Categories (RTK) --------- */

  const { data: categoriesData = [] } = useListCategoriesQuery({
    is_active: true,
    sort: "display_order",
    order: "asc",
  });

  const categories = categoriesData as Category[];

  // Önce featured olanı, yoksa ilk kategoriyi kullan
  const category: Category | null =
    categories.find((c) => c.is_featured) ?? categories[0] ?? null;

  const showContact = toBool(settings.home_header_show_contact);
  const heroImg = settings.home_hero_image_url || category?.image_url || "";

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      <div className="relative min-h-[600px] md:min_h-[700px] flex items-center">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          {heroImg ? (
            <>
              <img
                src={heroImg}
                alt="Hero Background"
                className="w-full h-full object-cover"
              />
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
              <span className="block mb-3">
                {settings.home_header_sub_text_1}
              </span>
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

            <div
              className="flex flex-col sm:flex-row gap-4 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              <Button
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/50 transition-all text-base px-10 h-14 rounded-full font-bold group"
                onClick={() =>
                  navigate(
                    category?.slug ? `/kategoriler/${category.slug}` : "/urunler",
                  )
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
                  onClick={() => {
                    window.location.href = "/iletisim";
                  }}
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
