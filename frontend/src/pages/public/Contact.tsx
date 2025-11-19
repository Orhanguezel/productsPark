// =============================================================
// FILE: src/pages/Contact.tsx
// =============================================================
import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSeoSettings } from "@/hooks/useSeoSettings";

// RTK: contacts + site_settings + mail
import {
  useCreateContactMutation,
} from "@/integrations/metahub/rtk/endpoints/contacts.endpoints";
import type {
  ContactCreateInput,
} from "@/integrations/metahub/db/types/contacts";

import {
  useGetSiteSettingByKeyQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

import {
  useSendMailMutation,
} from "@/integrations/metahub/rtk/endpoints/mail.endpoints";
import type { SendMailBody } from "@/integrations/metahub/rtk/endpoints/mail.endpoints";

// -------------------- Validation şeması --------------------
const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, { message: "Ad soyad en az 2 karakter olmalıdır" })
    .max(100),
  email: z
    .string()
    .trim()
    .email({ message: "Geçerli bir e-posta adresi giriniz" })
    .max(255),
  phone: z
    .string()
    .trim()
    .min(10, { message: "Telefon numarası en az 10 karakter olmalıdır" })
    .max(20),
  subject: z
    .string()
    .trim()
    .min(5, { message: "Konu en az 5 karakter olmalıdır" })
    .max(200),
  message: z
    .string()
    .trim()
    .min(10, { message: "Mesaj en az 10 karakter olmalıdır" })
    .max(1000),
});

// TR için çok kasmadan tel: link üretelim
const toTelHref = (raw: string): string => {
  const s = raw.trim();
  if (!s) return "";
  if (s.startsWith("+")) return `tel:${s}`;
  return `tel:${s.replace(/\s+/g, "")}`;
};

const Contact = () => {
  const { settings } = useSeoSettings();

  // -------------------- Form state --------------------
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
    website: "", // honeypot
  });

  // RTK mutations
  const [createContact, { isLoading: creating }] =
    useCreateContactMutation();
  const [sendMail, { isLoading: sendingMail }] =
    useSendMailMutation();

  const loading = creating || sendingMail;

  // WhatsApp numarasını site_settings'den çek
  const { data: whatsappSetting } = useGetSiteSettingByKeyQuery(
    "whatsapp_number"
  );

  const whatsappNumber =
    typeof whatsappSetting?.value === "string" ||
    typeof whatsappSetting?.value === "number"
      ? String(whatsappSetting.value)
      : "905555555555";

  // Admin iletişim mail adresini site_settings'den çek
  const { data: contactEmailSetting } =
    useGetSiteSettingByKeyQuery("contact_email");

  const defaultContactEmail = "destek@dijitalmarket.com";

  const adminEmailTo =
    typeof contactEmailSetting?.value === "string" ||
    typeof contactEmailSetting?.value === "number"
      ? String(contactEmailSetting.value)
      : defaultContactEmail;

  // İletişim bilgileri (görünen)
  const contactEmail = adminEmailTo;
  const contactPhoneDisplay = "+90 (555) 555 55 55";
  const contactPhoneTel = "+90 555 555 55 55"; // tel: için normalize ediyoruz
  const contactAddress = "İstanbul, Türkiye";

  const telHref = toTelHref(contactPhoneTel);

  // -------------------- Handlers --------------------
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // FE validation
      const validated = contactSchema.parse({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message,
      });

      const basePayload = {
        name: validated.name.trim(),
        email: validated.email.trim(),
        phone: validated.phone.trim(),
        subject: validated.subject.trim(),
        message: validated.message.trim(),
      };

      const websiteTrim = formData.website.trim();
      const payload: ContactCreateInput = websiteTrim
        ? { ...basePayload, website: websiteTrim }
        : { ...basePayload, website: null };

      // 1) Mesajı DB'ye kaydet
      await createContact(payload).unwrap();

      // 2) Admin'e mail gönder (SMTP ayarları BE'deki site_settings + env'den okunuyor)
      try {
        if (adminEmailTo) {
          const siteName = settings.site_title || "Dijital Market";

          const subjectMail = `${siteName} – Yeni iletişim mesajı: ${basePayload.subject}`;

          const textLines = [
            `Site: ${siteName}`,
            "",
            `Yeni bir iletişim formu dolduruldu:`,
            "",
            `Ad Soyad : ${basePayload.name}`,
            `E-posta  : ${basePayload.email}`,
            `Telefon  : ${basePayload.phone}`,
            "",
            `Konu     : ${basePayload.subject}`,
            "",
            `Mesaj:`,
            basePayload.message,
          ];

          const text = textLines.join("\n");

          const html = `
            <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
              <h2 style="font-size:18px;margin-bottom:8px;">Yeni İletişim Mesajı</h2>
              <p><strong>Site:</strong> ${siteName}</p>
              <p><strong>Ad Soyad:</strong> ${basePayload.name}</p>
              <p><strong>E-posta:</strong> ${basePayload.email}</p>
              <p><strong>Telefon:</strong> ${basePayload.phone}</p>
              <p><strong>Konu:</strong> ${basePayload.subject}</p>
              <p style="margin-top:12px;"><strong>Mesaj:</strong></p>
              <p style="white-space:pre-line;margin-top:4px;">${basePayload.message}</p>
            </div>
          `;

          const mailPayload: SendMailBody = {
            to: adminEmailTo,
            subject: subjectMail,
            text,
            html,
          };

          // Bu endpoint /mail/send -> BE tarafında SMTP ile gönderiyor
          await sendMail(mailPayload).unwrap();
        }
      } catch (mailErr) {
        // Mail gönderilemese bile form kaydı başarıyla alındı → sadece logla
        console.error("İletişim maili gönderilirken hata:", mailErr);
      }

      toast.success(
        "Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız."
      );

      // Form reset
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
        website: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(
          error.errors[0]?.message ?? "Lütfen form alanlarını kontrol edin"
        );
      } else if (
        typeof error === "object" &&
        error !== null &&
        "data" in error &&
        (error as { data?: { error?: string } }).data?.error
      ) {
        toast.error(
          `Hata: ${
            (error as { data?: { error?: string } }).data?.error ??
            "Bilinmeyen hata"
          }`
        );
      } else {
        toast.error("Mesaj gönderilirken bir hata oluştu");
      }
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent("Merhaba, size ulaşmak istiyorum.");
    window.open(`https://wa.me/${whatsappNumber}?text=${message}`, "_blank");
  };

  const generateContactSchema = () => {
    return {
      "@context": "https://schema.org/",
      "@type": "ContactPage",
      mainEntity: {
        "@type": "Organization",
        name: settings.site_title,
        contactPoint: {
          "@type": "ContactPoint",
          telephone: contactPhoneDisplay,
          contactType: "customer service",
          availableLanguage: ["Turkish"],
          areaServed: "TR",
        },
      },
    };
  };

  // -------------------- Render --------------------
  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_contact_title}</title>
        <meta
          name="description"
          content={settings.seo_contact_description}
        />
        <meta property="og:title" content={settings.seo_contact_title} />
        <meta
          property="og:description"
          content={settings.seo_contact_description}
        />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {JSON.stringify(generateContactSchema())}
        </script>
      </Helmet>

      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— İletişim</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Bizimle İletişime Geçin
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Sorularınız, önerileriniz veya sorunlarınız için bize ulaşın
          </p>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-12 flex-1">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Mesaj Gönderin</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Honeypot (gizli alan) */}
                    <div className="hidden">
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        name="website"
                        type="text"
                        value={formData.website}
                        onChange={handleInputChange}
                        autoComplete="off"
                        tabIndex={-1}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="Adınız Soyadınız"
                          value={formData.name}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="ornek@email.com"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                          disabled={loading}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="+90 5xx xxx xx xx"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Konu *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        placeholder="Mesajınızın konusu"
                        value={formData.subject}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Mesajınız *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Mesajınızı buraya yazın..."
                        rows={6}
                        value={formData.message}
                        onChange={handleInputChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      className="w-full gradient-primary"
                      disabled={loading}
                    >
                      {loading ? (
                        "Gönderiliyor..."
                      ) : (
                        <>
                          <Send className="w-5 h-5 mr-2" />
                          Mesaj Gönder
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>İletişim Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">E-posta</p>
                      <a
                        href={`mailto:${contactEmail}`}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {contactEmail}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Telefon</p>
                      <a
                        href={telHref}
                        className="text-muted-foreground hover:text-primary"
                      >
                        {contactPhoneDisplay}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Adres</p>
                      <p className="text-muted-foreground">
                        {contactAddress}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold mb-1">Çalışma Saatleri</p>
                      <p className="text-muted-foreground">7/24 Destek</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="gradient-primary text-white">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-3">
                    WhatsApp ile İletişim
                  </h3>
                  <p className="mb-4 text-white/90">
                    Hızlı yanıt almak için WhatsApp üzerinden bize ulaşabilirsiniz
                  </p>
                  <Button
                    className="w-full bg-white text-primary hover:bg.white/90"
                    onClick={handleWhatsApp}
                    disabled={loading}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    WhatsApp ile Yaz
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Contact;
