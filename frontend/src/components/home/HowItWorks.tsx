import { useEffect, useState } from "react";
import { Search, CreditCard, Download, Shield } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";

const HowItWorks = () => {
  const [settings, setSettings] = useState({
    home_how_it_works_title: "Nasıl Çalışır?",
    home_how_it_works_subtitle: "4 basit adımda dijital ürününüze sahip olun",
    home_step_1_title: "Ürünü Seçin",
    home_step_1_desc: "Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.",
    home_step_2_title: "Güvenli Ödeme",
    home_step_2_desc: "Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.",
    home_step_3_title: "Anında Teslimat",
    home_step_3_desc: "Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.",
    home_step_4_title: "7/24 Destek",
    home_step_4_desc: "Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.",
  });

  useEffect(() => {
    fetchSettings();

    const channel = metahub
      .channel('how-it-works-settings')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          // Sadece bu bileşenle ilgili ayarlar değiştiyse güncelle
          const relevantKeys = [
            'home_how_it_works_title',
            'home_how_it_works_subtitle',
            'home_step_1_title',
            'home_step_1_desc',
            'home_step_2_title',
            'home_step_2_desc',
            'home_step_3_title',
            'home_step_3_desc',
            'home_step_4_title',
            'home_step_4_desc'
          ];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('HowItWorks settings updated:', payload.new?.key);
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
            'home_how_it_works_title',
            'home_how_it_works_subtitle',
            'home_step_1_title',
            'home_step_1_desc',
            'home_step_2_title',
            'home_step_2_desc',
            'home_step_3_title',
            'home_step_3_desc',
            'home_step_4_title',
            'home_step_4_desc'
          ];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('HowItWorks settings inserted:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", [
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
      console.error("Error fetching how it works settings:", error);
    }
  };

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
    }
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
            <div key={index} className="relative">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full gradient-primary mb-6 relative">
                  <step.icon className="w-8 h-8 text-white" />
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] border-t-2 border-dashed border-primary/30"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
