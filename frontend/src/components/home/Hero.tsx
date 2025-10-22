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

const Hero = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [settings, setSettings] = useState({
    home_header_top_text: "İndirim Sezonu Başladı",
    home_header_bottom_text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
    home_header_sub_text_1: "Yeni Üyelere Özel",
    home_header_sub_text_2: "%10 Fırsatı Dijimin'de!",
    home_header_button_text: "Ürünleri İncele",
    home_header_show_contact: true,
    home_hero_image_url: "",
  });

  useEffect(() => {
    fetchSettings();
    fetchCategories();

    // Subscribe to real-time updates
    const channel = metahub
      .channel('home-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = [
            'home_header_top_text',
            'home_header_bottom_text',
            'home_header_sub_text_1',
            'home_header_sub_text_2',
            'home_header_button_text',
            'home_header_show_contact',
            'home_hero_image_url'
          ];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('Hero settings updated:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = [
            'home_header_top_text',
            'home_header_bottom_text',
            'home_header_sub_text_1',
            'home_header_sub_text_2',
            'home_header_button_text',
            'home_header_show_contact',
            'home_hero_image_url'
          ];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('Hero settings inserted:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await metahub
        .from("categories")
        .select("id, name, slug, image_url, icon, description")
        .eq("is_featured", true)
        .limit(1);

      if (error) throw error;
      if (data) setCategories(data);
    } catch (error) {
      console.error("Error fetching categories:", error);
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

      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error("Error fetching home settings:", error);
    }
  };

  const category = categories[0];

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5">
      {category && (
        <div className="relative min-h-[600px] md:min-h-[700px] flex items-center">
          {/* Background Image */}
          <div className="absolute inset-0 z-0">
            {settings.home_hero_image_url ? (
              <>
                <img
                  src={settings.home_hero_image_url}
                  alt="Hero Background"
                  className="w-full h-full object-cover"
                />
                {/* Dark Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30"></div>
              </>
            ) : category?.image_url ? (
              <>
                <img
                  src={category.image_url}
                  alt={category.name}
                  className="w-full h-full object-cover"
                />
                {/* Dark Overlay for better text readability */}
                <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-background/30"></div>
              </>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-background"></div>
            )}
          </div>

          {/* Content Overlay */}
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-2xl space-y-6 md:space-y-8 py-12 md:py-20">
              {/* Badge */}
              <div className="inline-flex items-center gap-3 bg-primary/10 backdrop-blur-md text-primary px-6 py-3 rounded-full text-sm font-bold border-2 border-primary/20 shadow-lg animate-fade-in">
                <Sparkles className="w-5 h-5 animate-pulse" />
                {settings.home_header_top_text}
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <span className="block mb-3">{settings.home_header_sub_text_1}</span>
                <span className="block bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
                  {settings.home_header_sub_text_2}
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-foreground/80 font-light leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {settings.home_header_bottom_text}
              </p>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                <Button
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xl hover:shadow-primary/50 transition-all text-base px-10 h-14 rounded-full font-bold group"
                  onClick={() => navigate(`/kategoriler/${category.slug}`)}
                >
                  {settings.home_header_button_text}
                  <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                {settings.home_header_show_contact && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-primary/20 hover:bg-primary/5 text-base px-10 h-14 rounded-full font-bold backdrop-blur-sm"
                    onClick={() => window.location.href = "/iletisim"}
                  >
                    İletişime Geç
                  </Button>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Decorative Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-20 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-[120px] animate-pulse pointer-events-none" style={{ animationDelay: '1s' }}></div>
    </section>
  );
};

export default Hero;
