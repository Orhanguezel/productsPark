// =============================================================
// FILE: src/components/home/FAQ.tsx
// =============================================================
import { useMemo } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

import type { Faq } from "@/integrations/metahub/rtk/types/faqs";
import { useListFaqsQuery } from "@/integrations/metahub/rtk/endpoints/faqs.endpoints";
import { useGetSiteSettingByKeyQuery } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

interface FAQItem {
  question: string;
  answer: string;
}

/** DB boşsa fallback olarak kullanılacak default sorular */
const defaultFAQs: FAQItem[] = [
  {
    question: "Ürünler ne kadar sürede teslim edilir?",
    answer:
      "Ödemeniz onaylandıktan sonra ürününüz otomatik olarak anında e-posta adresinize ve üye panelinize teslim edilir. Ortalama teslimat süresi 1-2 dakikadır.",
  },
  {
    question: "Hangi ödeme yöntemlerini kabul ediyorsunuz?",
    answer:
      "Kredi kartı, banka havalesi, Papara, PayTR, Shopier ve kripto para (Coinbase Commerce) ile ödeme yapabilirsiniz. Tüm ödemeler SSL sertifikası ile güvence altındadır.",
  },
  {
    question: "Ürün çalışmazsa ne olur?",
    answer:
      "Satın aldığınız ürün çalışmaz veya hatalı ise 7 gün içinde destek ekibimizle iletişime geçerek değişim veya iade talebinde bulunabilirsiniz. Tüm ürünlerimiz garanti kapsamındadır.",
  },
  {
    question: "Toplu alımlarda indirim var mı?",
    answer:
      "Evet! 5+ ürün alımlarında %5, 10+ ürün alımlarında %10 indirim otomatik olarak uygulanır. Daha fazla bilgi için müşteri hizmetlerimizle iletişime geçebilirsiniz.",
  },
  {
    question: "Lisanslar kaç cihazda kullanılabilir?",
    answer:
      "Her ürünün kullanım koşulları farklıdır. Ürün detay sayfasında lisans türü ve kaç cihazda kullanılabileceği belirtilmiştir. Tek kullanımlık, çoklu kullanım ve süreli lisanslar mevcuttur.",
  },
  {
    question: "Müşteri desteği nasıl alırım?",
    answer:
      "7/24 canlı destek, e-posta, WhatsApp ve Telegram üzerinden bizimle iletişime geçebilirsiniz. Üye panelinizden destek talebi oluşturabilir veya SSS bölümünü inceleyebilirsiniz.",
  },
];

const FAQ = () => {
  /* ---------- RTK: Public FAQs ---------- */
  // İstersen burada category'yi "home" dışında başka bir şey yapmak istersen değiştir.
  const {
    data: faqsData = [],
    isLoading: isFaqsLoading,
    isFetching: isFaqsFetching,
  } = useListFaqsQuery({
    category: "home",
    sort: "display_order",
    orderDir: "asc",
    limit: 50,
  });

  const faqItems: FAQItem[] = useMemo(() => {
    if (faqsData && faqsData.length > 0) {
      return (faqsData as Faq[]).map((row) => ({
        question: row.question,
        // answer LONGTEXT (HTML/metin) → şimdilik düz string olarak basıyoruz
        answer: String(row.answer ?? ""),
      }));
    }
    return defaultFAQs;
  }, [faqsData]);

  const loading = isFaqsLoading || isFaqsFetching;

  /* ---------- RTK: Site Settings (başlık/metinler) ---------- */

  const { data: titleSetting } =
    useGetSiteSettingByKeyQuery("home_faq_title");
  const { data: subtitleSetting } =
    useGetSiteSettingByKeyQuery("home_faq_subtitle");
  const { data: ctaTitleSetting } =
    useGetSiteSettingByKeyQuery("home_faq_cta_title");
  const { data: ctaSubtitleSetting } =
    useGetSiteSettingByKeyQuery("home_faq_cta_subtitle");
  const { data: ctaButtonSetting } =
    useGetSiteSettingByKeyQuery("home_faq_cta_button");

  const homeFaqTitle =
    (titleSetting?.value as string | undefined) ??
    "Sıkça Sorulan Sorular";
  const homeFaqSubtitle =
    (subtitleSetting?.value as string | undefined) ??
    "Merak ettiklerinizin cevaplarını burada bulabilirsiniz";
  const homeFaqCtaTitle =
    (ctaTitleSetting?.value as string | undefined) ??
    "Başka sorunuz mu var?";
  const homeFaqCtaSubtitle =
    (ctaSubtitleSetting?.value as string | undefined) ??
    "Destek ekibimiz size yardımcı olmak için hazır";
  const homeFaqCtaButton =
    (ctaButtonSetting?.value as string | undefined) ??
    "Bize Ulaşın →";

  /* ---------- Schema.org ---------- */

  const generateFAQSchema = () => ({
    "@context": "https://schema.org/",
    "@type": "FAQPage",
    mainEntity: faqItems.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  });

  const faqSchema = generateFAQSchema();

  /* ---------- Render ---------- */

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>

          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {homeFaqTitle}
            </h2>
            <p className="text-muted-foreground">{homeFaqSubtitle}</p>
          </div>

          {loading ? (
            <div className="text-center text-muted-foreground">
              Yükleniyor...
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, index) => (
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
          )}

          <div className="mt-12 text-center p-6 bg-card rounded-xl border border-border">
            <h3 className="font-semibold mb-2">
              {homeFaqCtaTitle}
            </h3>
            <p className="text-muted-foreground mb-4">
              {homeFaqCtaSubtitle}
            </p>
            <a
              href="#iletisim"
              className="text-primary hover:underline font-medium"
            >
              {homeFaqCtaButton}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
