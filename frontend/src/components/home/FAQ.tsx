import { useEffect, useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { metahub } from "@/integrations/metahub/client";

interface FAQItem {
  question: string;
  answer: string;
}

const defaultFAQs: FAQItem[] = [
  {
    question: "Ürünler ne kadar sürede teslim edilir?",
    answer: "Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır."
  },
  {
    question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
    answer: "Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır."
  },
  {
    question: "Ürün çalışmazsa ne olur?",
    answer: "Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır."
  },
  {
    question: "Toplu alımlarda indirim var mı?",
    answer: "Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz."
  },
  {
    question: "Lisanslar kaç cihazda kullanılabilir?",
    answer: "Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur."
  },
  {
    question: "Müşteri desteği nasıl alırım?",
    answer: "7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz."
  }
];

const FAQ = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFAQs);
  const [settings, setSettings] = useState({
    home_faq_title: "Sıkça Sorulan Sorular",
    home_faq_subtitle: "Merak ettiklerinizin cevaplarını burada bulabilirsiniz",
    home_faq_cta_title: "Başka sorunuz mu var?",
    home_faq_cta_subtitle: "Destek ekibimiz size yardımcı olmak için hazır",
    home_faq_cta_button: "Bize Ulaşın →",
  });

  useEffect(() => {
    fetchSettings();

    const channel = metahub
      .channel('faq-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = [
            'home_faq_title',
            'home_faq_subtitle',
            'home_faq_cta_title',
            'home_faq_cta_subtitle',
            'home_faq_cta_button',
            'home_faq_items'
          ];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('FAQ settings updated:', payload.new?.key);
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
            'home_faq_title',
            'home_faq_subtitle',
            'home_faq_cta_title',
            'home_faq_cta_subtitle',
            'home_faq_cta_button',
            'home_faq_items'
          ];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('FAQ settings inserted:', payload.new?.key);
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
          "home_faq_title",
          "home_faq_subtitle",
          "home_faq_cta_title",
          "home_faq_cta_subtitle",
          "home_faq_cta_button",
          "home_faq_items",
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings((prev) => ({ ...prev, ...settingsObj }));

        // Load FAQ items from settings if available
        if (settingsObj.home_faq_items && Array.isArray(settingsObj.home_faq_items) && settingsObj.home_faq_items.length > 0) {
          setFaqs(settingsObj.home_faq_items);
        }
      }
    } catch (error) {
      console.error("Error fetching FAQ settings:", error);
    }
  };

  const generateFAQSchema = () => {
    return {
      "@context": "https://schema.org/",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <script type="application/ld+json">
            {JSON.stringify(generateFAQSchema())}
          </script>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {settings.home_faq_title}
            </h2>
            <p className="text-muted-foreground">
              {settings.home_faq_subtitle}
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <div className="mt-12 text-center p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold mb-2">{settings.home_faq_cta_title}</h3>
            <p className="text-muted-foreground mb-4">
              {settings.home_faq_cta_subtitle}
            </p>
            <a
              href="#iletisim"
              className="text-primary hover:underline font-medium"
            >
              {settings.home_faq_cta_button}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
