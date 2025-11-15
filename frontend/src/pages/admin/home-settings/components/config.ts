// =============================================================
// FILE: src/pages/admin/home-settings/config.ts
// =============================================================

export interface HomeSettings {
  home_display_mode: string;
  home_header_top_text: string;
  home_header_bottom_text: string;
  home_header_sub_text_1: string;
  home_header_sub_text_2: string;
  home_header_button_text: string;
  home_header_show_contact: boolean;
  home_hero_image_url: string;

  home_featured_badge: string;
  home_featured_title: string;
  home_featured_button: string;

  home_how_it_works_title: string;
  home_how_it_works_subtitle: string;
  home_step_1_title: string;
  home_step_1_desc: string;
  home_step_2_title: string;
  home_step_2_desc: string;
  home_step_3_title: string;
  home_step_3_desc: string;
  home_step_4_title: string;
  home_step_4_desc: string;

  home_faq_title: string;
  home_faq_subtitle: string;
  home_faq_items: Array<{ question: string; answer: string }>;
  home_faq_cta_title: string;
  home_faq_cta_subtitle: string;
  home_faq_cta_button: string;

  home_blog_badge: string;
  home_blog_title: string;
  home_blog_subtitle: string;
  home_blog_button: string;

  home_scroll_content: string;
  home_scroll_content_active: boolean;
  home_scroll_image_url: string;
}

export const defaultHomeSettings: HomeSettings = {
  home_display_mode: "list",

  home_header_top_text: "İndirim Sezonu Başladı",
  home_header_bottom_text:
    "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
  home_header_sub_text_1: "Yeni Üyelere Özel",
  home_header_sub_text_2: "%10 Fırsatı Dijimin'de!",
  home_header_button_text: "Ürünleri İncele",
  home_header_show_contact: true,
  home_hero_image_url: "",

  home_featured_badge: "Öne Çıkan Ürünler",
  home_featured_title: "En çok satan ürünlerimize göz atın",
  home_featured_button: "Tüm Ürünleri Görüntüle",

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

  home_faq_title: "Sıkça Sorulan Sorular",
  home_faq_subtitle:
    "Merak ettiklerinizin cevaplarını burada bulabilirsiniz",
  home_faq_items: [
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
  ],
  home_faq_cta_title: "Başka sorunuz mu var?",
  home_faq_cta_subtitle: "Destek ekibimiz size yardımcı olmak için hazır",
  home_faq_cta_button: "Bize Ulaşın →",

  home_blog_badge: "Blog Yazılarımız",
  home_blog_title: "Güncel İçerikler",
  home_blog_subtitle:
    "Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler",
  home_blog_button: "Tüm Blog Yazıları",

  home_scroll_content:
    '<h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p>',
  home_scroll_content_active: true,

  // 👇 Yeni scroll görsel alanı default’u
  home_scroll_image_url: "",
};

/**
 * Server’dan dönen key/value’ları default şekle uydurur, türleri korur.
 * HomeSettings.tsx içinde:
 *   coerceToHomeSettingsShape({ ...defaultHomeSettings, ...prev }, map)
 * şeklinde kullanıyoruz.
 */
export function coerceToHomeSettingsShape(
  base: HomeSettings,
  map: Record<string, unknown>
): HomeSettings {
  const out: Record<string, any> = { ...base };

  for (const key of Object.keys(base) as (keyof HomeSettings)[]) {
    if (!(key in map)) continue;

    const incoming = map[key as string];
    const defaultValue = base[key];

    // Array field (örn: home_faq_items)
    if (Array.isArray(defaultValue)) {
      out[key] = Array.isArray(incoming) ? incoming : defaultValue;
      continue;
    }

    // Boolean field
    if (typeof defaultValue === "boolean") {
      if (typeof incoming === "boolean") {
        out[key] = incoming;
      } else if (typeof incoming === "string") {
        out[key] =
          incoming === "true" ||
          incoming === "1" ||
          incoming.toLowerCase() === "yes";
      } else {
        out[key] = defaultValue;
      }
      continue;
    }

    // Number field (şu an yok ama future-proof dursun)
    if (typeof defaultValue === "number") {
      const n = Number(incoming);
      out[key] = Number.isFinite(n) ? n : defaultValue;
      continue;
    }

    // Object field (ileride kompleks nested objeler için)
    if (
      defaultValue &&
      typeof defaultValue === "object" &&
      !Array.isArray(defaultValue)
    ) {
      out[key] =
        incoming && typeof incoming === "object" ? incoming : defaultValue;
      continue;
    }

    // String / diğer primitive
    if (incoming === null || typeof incoming === "undefined") {
      out[key] = defaultValue;
    } else {
      out[key] = String(incoming);
    }
  }

  return out as HomeSettings;
}
