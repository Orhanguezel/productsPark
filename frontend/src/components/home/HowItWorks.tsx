// FILE: src/components/home/HowItWorks.tsx
import { useEffect, useState } from "react";
import { Search, CreditCard, Download, Shield } from "lucide-react";

import {
  useListSiteSettingsQuery,
  type SiteSetting,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

const DEFAULT_SETTINGS = {
  home_how_it_works_title: "Nasıl Çalışır?",
  home_how_it_works_subtitle: "4 basit adımda dijital ürününüze sahip olun",
  home_step_1_title: "Ürünü Seçin",
  home_step_1_desc:
    "Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.",
  home_step_2_title: "Güvenli Ödeme",
  home_step_2_desc:
    "Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.",
  home_step_3_title: "Anında Teslimat",
  home_step_3_desc:
    "Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.",
  home_step_4_title: "7/24 Destek",
  home_step_4_desc:
    "Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.",
};

type HowItWorksSettings = typeof DEFAULT_SETTINGS;

const STRING_SETTING_KEYS = [
  "home_how_it_works_title",
  "home_how_it_works_subtitle",
  "home_step_1_title",
  "home_step_1_desc",
  "home_step_2_title",
  "home_step_2_desc",
  "home_step_3_title",
  "home_step_3_desc",
  "home_step_4_title",
  "home_step_4_desc",
] as const;

type StringSettingKey = (typeof STRING_SETTING_KEYS)[number];

const HowItWorks = () => {
  const [settings, setSettings] = useState<HowItWorksSettings>(
    DEFAULT_SETTINGS,
  );

  // home_* prefix’i ile tüm home ayarlarını çekiyoruz
  const { data: siteSettings } = useListSiteSettingsQuery({
    prefix: "home_",
  });

  useEffect(() => {
    if (!siteSettings) return;

    const dict: Record<string, SiteSetting["value"]> = {};
    for (const item of siteSettings) {
      dict[item.key] = item.value;
    }

    setSettings((prev) => {
      const next: HowItWorksSettings = { ...prev };

      STRING_SETTING_KEYS.forEach((key: StringSettingKey) => {
        const raw = dict[key];
        if (typeof raw === "string") {
          next[key] = raw as HowItWorksSettings[StringSettingKey];
        }
      });

      return next;
    });
  }, [siteSettings]);

  const steps = [
    {
      icon: Search,
      title: settings.home_step_1_title,
      description: settings.home_step_1_desc,
    },
    {
      icon: CreditCard,
      title: settings.home_step_2_title,
      description: settings.home_step_2_desc,
    },
    {
      icon: Download,
      title: settings.home_step_3_title,
      description: settings.home_step_3_desc,
    },
    {
      icon: Shield,
      title: settings.home_step_4_title,
      description: settings.home_step_4_desc,
    },
  ];

  return (
    <section id="nasil-calisir" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {settings.home_how_it_works_title}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {settings.home_how_it_works_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={step.title} className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6 relative">
                  <step.icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
