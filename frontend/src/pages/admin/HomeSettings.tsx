import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";
import { toast } from "sonner";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface HomeSettings {
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
}

const defaultSettings: HomeSettings = {
  home_display_mode: "list",
  home_header_top_text: "İndirim Sezonu Başladı",
  home_header_bottom_text: "It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout.",
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
  home_step_1_desc: "Geniş ürün yelpazemizden ihtiyacınıza uygun dijital ürünü bulun ve inceleyin.",
  home_step_2_title: "Güvenli Ödeme",
  home_step_2_desc: "Kredi kartı, havale veya kripto para ile güvenli ödeme yapın.",
  home_step_3_title: "Anında Teslimat",
  home_step_3_desc: "Ödeme onaylandıktan sonra ürününüz otomatik olarak e-posta ve panele iletilir.",
  home_step_4_title: "7/24 Destek",
  home_step_4_desc: "Herhangi bir sorun yaşarsanız destek ekibimiz size yardımcı olmaya hazır.",
  home_faq_title: "Sıkça Sorulan Sorular",
  home_faq_subtitle: "Merak ettiklerinizin cevaplarını burada bulabilirsiniz",
  home_faq_items: [
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
  ],
  home_faq_cta_title: "Başka sorunuz mu var?",
  home_faq_cta_subtitle: "Destek ekibimiz size yardımcı olmak için hazır",
  home_faq_cta_button: "Bize Ulaşın →",
  home_blog_badge: "Blog Yazılarımız",
  home_blog_title: "Güncel İçerikler",
  home_blog_subtitle: "Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler",
  home_blog_button: "Tüm Blog Yazıları",
  home_scroll_content: "<h2>Hesap Satın Al</h2><p>Tüm dünyada bulunan oyunları daha eğlenceli hale getiren birçok ürün ve eşya, oyun keyfini katlamanıza destek oluyoruz. Güvenilir satın alma ve pratik uygulama özellikleri sayesinde oyun sevenerin ihtiyaçlarına yanıt vermeyi başaran ürünlerimiz, birçok kişinin tercih olun. Savaş, macera, mücadele, hayatta kalma gibi farklı konseptlerde tasarlanan birbirinden heyecanlı oyunlar ile sizler de vakitinizi en iyi ve eğlenceli şekilde değerlendirebilirsiniz.</p>",
  home_scroll_content_active: true,
};


export default function HomeSettings() {
  const [settings, setSettings] = useState<HomeSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", Object.keys(defaultSettings));

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings({ ...defaultSettings, ...settingsObj });
      }
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast.error("Ayarlar yüklenirken hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Her ayarı tek tek kaydet
      const savePromises = Object.entries(settings).map(async ([key, value]) => {
        // Önce mevcut kaydı kontrol et
        const { data: existing } = await metahub
          .from("site_settings")
          .select("id")
          .eq("key", key)
          .maybeSingle();

        if (existing) {
          // Güncelle
          return metahub
            .from("site_settings")
            .update({ value, updated_at: new Date().toISOString() })
            .eq("key", key);
        } else {
          // Yeni kayıt oluştur
          return metahub
            .from("site_settings")
            .insert({ key, value });
        }
      });

      // Tüm kayıtların tamamlanmasını bekle
      const results = await Promise.all(savePromises);

      // Hata kontrolü
      const errors = results.filter(result => result.error);
      if (errors.length > 0) {
        console.error("Errors saving settings:", errors);
        throw new Error("Bazı ayarlar kaydedilemedi");
      }

      toast.success("Tüm ana sayfa ayarları başarıyla kaydedildi!");
    } catch (error: any) {
      console.error("Error saving settings:", error);
      toast.error("Ayarlar kaydedilirken hata oluştu: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Ana Sayfa Ayarları">
        <div className="flex items-center justify-center py-8">
          <p>Yükleniyor...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ana Sayfa Ayarları">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Hero Bölümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="header_top">Üst Rozet Yazısı</Label>
              <Input
                id="header_top"
                value={settings.home_header_top_text}
                onChange={(e) =>
                  setSettings({ ...settings, home_header_top_text: e.target.value })
                }
                placeholder="İndirim Sezonu Başladı"
              />
              <p className="text-xs text-muted-foreground">Hero bölümünün en üstünde görünen rozet metni</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header_sub1">Ana Başlık - 1. Satır</Label>
              <Input
                id="header_sub1"
                value={settings.home_header_sub_text_1}
                onChange={(e) =>
                  setSettings({ ...settings, home_header_sub_text_1: e.target.value })
                }
                placeholder="Yeni Üyelere Özel"
              />
              <p className="text-xs text-muted-foreground">Hero başlığının ilk satırı (normal yazı)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header_sub2">Ana Başlık - 2. Satır</Label>
              <Input
                id="header_sub2"
                value={settings.home_header_sub_text_2}
                onChange={(e) =>
                  setSettings({ ...settings, home_header_sub_text_2: e.target.value })
                }
                placeholder="%10 Fırsatı Dijimin'de!"
              />
              <p className="text-xs text-muted-foreground">Hero başlığının ikinci satırı (gradient efektli)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="header_bottom">Açıklama Metni</Label>
              <Textarea
                id="header_bottom"
                value={settings.home_header_bottom_text}
                onChange={(e) =>
                  setSettings({ ...settings, home_header_bottom_text: e.target.value })
                }
                rows={3}
                placeholder="It is a long established fact..."
              />
              <p className="text-xs text-muted-foreground">Hero başlığının altında görünen açıklama</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="button_text">Ana Buton Yazısı</Label>
              <Input
                id="button_text"
                value={settings.home_header_button_text}
                onChange={(e) =>
                  setSettings({ ...settings, home_header_button_text: e.target.value })
                }
                placeholder="Ürünleri İncele"
              />
              <p className="text-xs text-muted-foreground">Ana aksiyon butonundaki yazı</p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="show_contact"
                  checked={settings.home_header_show_contact}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, home_header_show_contact: checked })
                  }
                />
                <Label htmlFor="show_contact">İletişime Geç Butonu Göster</Label>
              </div>
              <p className="text-xs text-muted-foreground">İkinci buton (İletişime Geç) gösterilsin mi?</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="hero_image">Hero Arka Plan Görseli</Label>
              <Input
                id="hero_image"
                type="file"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `hero-${Date.now()}.${fileExt}`;
                      const filePath = `${fileName}`;

                      const { error: uploadError } = await metahubstorage
                        .from('product-images')
                        .upload(filePath, file);

                      if (uploadError) throw uploadError;

                      const { data: { publicUrl } } = metahubstorage
                        .from('product-images')
                        .getPublicUrl(filePath);

                      setSettings({ ...settings, home_hero_image_url: publicUrl });
                      toast.success("Görsel yüklendi!");
                    } catch (error) {
                      console.error('Error uploading image:', error);
                      toast.error("Görsel yüklenirken hata oluştu");
                    }
                  }
                }}
              />
              {settings.home_hero_image_url && (
                <div className="mt-2">
                  <img
                    src={settings.home_hero_image_url}
                    alt="Hero Preview"
                    className="w-full max-w-md h-40 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="mt-2"
                    onClick={() => setSettings({ ...settings, home_hero_image_url: "" })}
                  >
                    Görseli Kaldır
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Hero bölümünün arka plan görseli. Boş bırakılırsa öne çıkan kategorinin görseli kullanılır.
              </p>
            </div>

            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">📌 Kategoriler</p>
              <p className="text-xs text-muted-foreground">
                Hero bölümünde gösterilen kategori bilgileri, <strong>Kategoriler</strong> sayfasından
                "Öne Çıkan" olarak işaretlenen ilk kategori gösterilir. Kategorileri yönetmek için Kategoriler sayfasına gidin.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Öne Çıkan Ürünler Bölümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rozet Yazısı</Label>
              <Input
                value={settings.home_featured_badge}
                onChange={(e) =>
                  setSettings({ ...settings, home_featured_badge: e.target.value })
                }
                placeholder="Öne Çıkan Ürünler"
              />
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={settings.home_featured_title}
                onChange={(e) =>
                  setSettings({ ...settings, home_featured_title: e.target.value })
                }
                placeholder="En çok satan ürünlerimize göz atın"
              />
            </div>
            <div className="space-y-2">
              <Label>Buton Yazısı</Label>
              <Input
                value={settings.home_featured_button}
                onChange={(e) =>
                  setSettings({ ...settings, home_featured_button: e.target.value })
                }
                placeholder="Tüm Ürünleri Görüntüle"
              />
            </div>

            {/* Bilgilendirme */}
            <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium">📌 Öne Çıkan Ürünler</p>
              <p className="text-xs text-muted-foreground">
                Anasayfada hangi ürünlerin gösterileceğini belirlemek için{" "}
                <strong>Ürün Yönetimi</strong> sayfasından her ürünün detayında{" "}
                <strong>"Anasayfada Göster"</strong> seçeneğini aktif edin.
                <br />
                Ürünler satış sayısına göre sıralanır ve maksimum 8 ürün gösterilir.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nasıl Çalışır Bölümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={settings.home_how_it_works_title}
                onChange={(e) =>
                  setSettings({ ...settings, home_how_it_works_title: e.target.value })
                }
                placeholder="Nasıl Çalışır?"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Başlık</Label>
              <Input
                value={settings.home_how_it_works_subtitle}
                onChange={(e) =>
                  setSettings({ ...settings, home_how_it_works_subtitle: e.target.value })
                }
                placeholder="4 basit adımda dijital ürününüze sahip olun"
              />
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Adım 1</h4>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={settings.home_step_1_title}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_1_title: e.target.value })
                  }
                  placeholder="Ürünü Seçin"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={settings.home_step_1_desc}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_1_desc: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Adım 2</h4>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={settings.home_step_2_title}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_2_title: e.target.value })
                  }
                  placeholder="Güvenli Ödeme"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={settings.home_step_2_desc}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_2_desc: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Adım 3</h4>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={settings.home_step_3_title}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_3_title: e.target.value })
                  }
                  placeholder="Anında Teslimat"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={settings.home_step_3_desc}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_3_desc: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">Adım 4</h4>
              <div className="space-y-2">
                <Label>Başlık</Label>
                <Input
                  value={settings.home_step_4_title}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_4_title: e.target.value })
                  }
                  placeholder="7/24 Destek"
                />
              </div>
              <div className="space-y-2">
                <Label>Açıklama</Label>
                <Textarea
                  value={settings.home_step_4_desc}
                  onChange={(e) =>
                    setSettings({ ...settings, home_step_4_desc: e.target.value })
                  }
                  rows={2}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSS Bölümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={settings.home_faq_title}
                onChange={(e) =>
                  setSettings({ ...settings, home_faq_title: e.target.value })
                }
                placeholder="Sıkça Sorulan Sorular"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Başlık</Label>
              <Input
                value={settings.home_faq_subtitle}
                onChange={(e) =>
                  setSettings({ ...settings, home_faq_subtitle: e.target.value })
                }
                placeholder="Merak ettiklerinizin cevaplarını burada bulabilirsiniz"
              />
            </div>
            <div className="border-t pt-4 space-y-4">
              <h4 className="font-medium">CTA Bölümü</h4>
              <div className="space-y-2">
                <Label>CTA Başlık</Label>
                <Input
                  value={settings.home_faq_cta_title}
                  onChange={(e) =>
                    setSettings({ ...settings, home_faq_cta_title: e.target.value })
                  }
                  placeholder="Başka sorunuz mu var?"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Alt Yazı</Label>
                <Input
                  value={settings.home_faq_cta_subtitle}
                  onChange={(e) =>
                    setSettings({ ...settings, home_faq_cta_subtitle: e.target.value })
                  }
                  placeholder="Destek ekibimiz size yardımcı olmak için hazır"
                />
              </div>
              <div className="space-y-2">
                <Label>CTA Buton Yazısı</Label>
                <Input
                  value={settings.home_faq_cta_button}
                  onChange={(e) =>
                    setSettings({ ...settings, home_faq_cta_button: e.target.value })
                  }
                  placeholder="Bize Ulaşın →"
                />
              </div>
            </div>

            <div className="border-t pt-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">SSS Öğeleri</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newFaqItems = [...(settings.home_faq_items || []), { question: "", answer: "" }];
                    setSettings({ ...settings, home_faq_items: newFaqItems });
                  }}
                >
                  + SSS Ekle
                </Button>
              </div>
              {(settings.home_faq_items || []).map((faq, index) => (
                <div key={index} className="p-4 border rounded-lg space-y-3">
                  <div className="space-y-2">
                    <Label>Soru</Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => {
                        const newFaqItems = [...(settings.home_faq_items || [])];
                        newFaqItems[index].question = e.target.value;
                        setSettings({ ...settings, home_faq_items: newFaqItems });
                      }}
                      placeholder="Soru girin"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Cevap</Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => {
                        const newFaqItems = [...(settings.home_faq_items || [])];
                        newFaqItems[index].answer = e.target.value;
                        setSettings({ ...settings, home_faq_items: newFaqItems });
                      }}
                      placeholder="Cevap girin"
                      rows={3}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      const newFaqItems = (settings.home_faq_items || []).filter((_, i) => i !== index);
                      setSettings({ ...settings, home_faq_items: newFaqItems });
                    }}
                  >
                    Sil
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Blog Bölümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Rozet Yazısı</Label>
              <Input
                value={settings.home_blog_badge}
                onChange={(e) =>
                  setSettings({ ...settings, home_blog_badge: e.target.value })
                }
                placeholder="Blog Yazılarımız"
              />
            </div>
            <div className="space-y-2">
              <Label>Başlık</Label>
              <Input
                value={settings.home_blog_title}
                onChange={(e) =>
                  setSettings({ ...settings, home_blog_title: e.target.value })
                }
                placeholder="Güncel İçerikler"
              />
            </div>
            <div className="space-y-2">
              <Label>Alt Başlık</Label>
              <Input
                value={settings.home_blog_subtitle}
                onChange={(e) =>
                  setSettings({ ...settings, home_blog_subtitle: e.target.value })
                }
                placeholder="Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler"
              />
            </div>
            <div className="space-y-2">
              <Label>Buton Yazısı</Label>
              <Input
                value={settings.home_blog_button}
                onChange={(e) =>
                  setSettings({ ...settings, home_blog_button: e.target.value })
                }
                placeholder="Tüm Blog Yazıları"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Anasayfa Makale Alanı</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 pb-4">
              <Switch
                id="scroll_content_active"
                checked={settings.home_scroll_content_active}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, home_scroll_content_active: checked })
                }
              />
              <Label htmlFor="scroll_content_active">Aktif</Label>
            </div>

            <div className="space-y-2">
              <Label>İçerik</Label>
              <div className="border rounded-md overflow-hidden">
                <ReactQuill
                  value={settings.home_scroll_content}
                  onChange={(value) =>
                    setSettings({ ...settings, home_scroll_content: value })
                  }
                  className="bg-background"
                  theme="snow"
                  style={{ height: "300px" }}
                  modules={{
                    toolbar: [
                      [{ header: [1, 2, 3, false] }],
                      ["bold", "italic", "underline", "strike"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      [{ color: [] }, { background: [] }],
                      ["link", "image"],
                      ["clean"],
                    ],
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-12">
                Bu içerik anasayfada scroll edilebilir bir alanda gösterilir.
                Maksimum yükseklik 400px, genişlik grid genişliği kadardır.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="w-4 h-4" />
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
