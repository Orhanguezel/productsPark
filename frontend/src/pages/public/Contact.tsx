import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { metahub } from "@/integrations/metahub/client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { useSeoSettings } from "@/hooks/useSeoSettings";

const contactSchema = z.object({
  name: z.string().trim().min(2, { message: "Ad soyad en az 2 karakter olmalıdır" }).max(100),
  email: z.string().trim().email({ message: "Geçerli bir e-posta adresi giriniz" }).max(255),
  subject: z.string().trim().min(5, { message: "Konu en az 5 karakter olmalıdır" }).max(200),
  message: z.string().trim().min(10, { message: "Mesaj en az 10 karakter olmalıdır" }).max(1000),
});

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const { settings } = useSeoSettings();
  const [whatsappNumber, setWhatsappNumber] = useState("905555555555");

  useEffect(() => {
    fetchWhatsappNumber();
  }, []);

  const fetchWhatsappNumber = async () => {
    try {
      const { data } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "whatsapp_number")
        .maybeSingle();

      if (data?.value) {
        setWhatsappNumber(String(data.value));
      }
    } catch (error) {
      console.error("Error fetching whatsapp number:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const validated = contactSchema.parse(formData);
      setLoading(true);

      // Simulate sending message
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success("Mesajınız başarıyla gönderildi! En kısa sürede size dönüş yapacağız.");

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Mesaj gönderilirken bir hata oluştu");
      }
    } finally {
      setLoading(false);
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
      "mainEntity": {
        "@type": "Organization",
        "name": settings.site_title,
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+90-555-555-5555",
          "contactType": "customer service",
          "availableLanguage": ["Turkish"],
          "areaServed": "TR"
        }
      }
    };
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_contact_title}</title>
        <meta name="description" content={settings.seo_contact_description} />
        <meta property="og:title" content={settings.seo_contact_title} />
        <meta property="og:description" content={settings.seo_contact_description} />
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Ad Soyad *</Label>
                        <Input
                          id="name"
                          placeholder="Adınız Soyadınız"
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">E-posta *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="ornek@email.com"
                          value={formData.email}
                          onChange={(e) =>
                            setFormData({ ...formData, email: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subject">Konu *</Label>
                      <Input
                        id="subject"
                        placeholder="Mesajınızın konusu"
                        value={formData.subject}
                        onChange={(e) =>
                          setFormData({ ...formData, subject: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Mesajınız *</Label>
                      <Textarea
                        id="message"
                        placeholder="Mesajınızı buraya yazın..."
                        rows={6}
                        value={formData.message}
                        onChange={(e) =>
                          setFormData({ ...formData, message: e.target.value })
                        }
                        required
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
                        href="mailto:destek@dijitalmarket.com"
                        className="text-muted-foreground hover:text-primary"
                      >
                        destek@dijitalmarket.com
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
                        href="tel:+905555555555"
                        className="text-muted-foreground hover:text-primary"
                      >
                        +90 (555) 555 55 55
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
                        İstanbul, Türkiye
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
                    className="w-full bg-white text-primary hover:bg-white/90"
                    onClick={handleWhatsApp}
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
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