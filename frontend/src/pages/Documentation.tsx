import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  ShoppingCart,
  CreditCard,
  Users,
  Settings,
  FileText,
  MessageSquare,
  Tag,
  Key,
  Smartphone,
  BarChart,
  Shield,
  Zap,
  Globe,
  Mail,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Section {
  id: string;
  title: string;
  icon: any;
  subsections?: { id: string; title: string }[];
}

const sections: Section[] = [
  {
    id: "giris",
    title: "Giriş",
    icon: Package,
    subsections: [
      { id: "hakkinda", title: "Script Hakkında" },
      { id: "ozellikler", title: "Temel Özellikler" },
      { id: "gereksinimler", title: "Sistem Gereksinimleri" },
    ],
  },
  {
    id: "kurulum",
    title: "Kurulum",
    icon: Settings,
    subsections: [
      { id: "baslangic", title: "Başlangıç" },
      { id: "veritabani", title: "Veritabanı Kurulumu" },
      { id: "yapilandirma", title: "Yapılandırma" },
    ],
  },
  {
    id: "urun-yonetimi",
    title: "Ürün Yönetimi",
    icon: Package,
    subsections: [
      { id: "urun-ekleme", title: "Ürün Ekleme" },
      { id: "kategoriler", title: "Kategori Yönetimi" },
      { id: "stok", title: "Stok Yönetimi" },
      { id: "urun-tipleri", title: "Ürün Tipleri" },
    ],
  },
  {
    id: "odeme-sistemleri",
    title: "Ödeme Sistemleri",
    icon: CreditCard,
    subsections: [
      { id: "shopier", title: "Shopier Entegrasyonu" },
      { id: "paytr", title: "PayTR Entegrasyonu" },
      { id: "havale", title: "Havale/EFT" },
      { id: "wallet", title: "Cüzdan Sistemi" },
    ],
  },
  {
    id: "api-entegrasyonlari",
    title: "API Entegrasyonları",
    icon: Zap,
    subsections: [
      { id: "smm-api", title: "SMM Panel API" },
      { id: "turkpin", title: "Turkpin API" },
      { id: "api-yonetimi", title: "API Sağlayıcı Yönetimi" },
    ],
  },
  {
    id: "kullanici-yonetimi",
    title: "Kullanıcı Yönetimi",
    icon: Users,
    subsections: [
      { id: "kayit-giris", title: "Kayıt ve Giriş" },
      { id: "roller", title: "Roller ve Yetkiler" },
      { id: "profil", title: "Profil Yönetimi" },
    ],
  },
  {
    id: "siparis-yonetimi",
    title: "Sipariş Yönetimi",
    icon: ShoppingCart,
    subsections: [
      { id: "siparis-akisi", title: "Sipariş Akışı" },
      { id: "teslimat", title: "Teslimat Türleri" },
      { id: "durum-takibi", title: "Durum Takibi" },
    ],
  },
  {
    id: "blog-icerik",
    title: "Blog & İçerik",
    icon: FileText,
    subsections: [
      { id: "blog-yonetimi", title: "Blog Yönetimi" },
      { id: "ozel-sayfalar", title: "Özel Sayfalar" },
      { id: "menu", title: "Menü Yönetimi" },
    ],
  },
  {
    id: "pazarlama",
    title: "Pazarlama Araçları",
    icon: BarChart,
    subsections: [
      { id: "kuponlar", title: "Kupon Sistemi" },
      { id: "popup", title: "Pop-up Kampanyaları" },
      { id: "fake-bildirim", title: "Sahte Bildirimler" },
      { id: "topbar", title: "Üst Bildirim Çubuğu" },
    ],
  },
  {
    id: "destek",
    title: "Destek Sistemi",
    icon: MessageSquare,
    subsections: [
      { id: "ticket", title: "Ticket Sistemi" },
      { id: "mail-sablonlari", title: "E-posta Şablonları" },
      { id: "bildirimler", title: "Bildirim Sistemi" },
    ],
  },
  {
    id: "guvenlik",
    title: "Güvenlik",
    icon: Shield,
    subsections: [
      { id: "rls", title: "Row Level Security" },
      { id: "auth", title: "Kimlik Doğrulama" },
      { id: "roller-yetki", title: "Rol Bazlı Yetkilendirme" },
    ],
  },
  {
    id: "seo",
    title: "SEO & Optimizasyon",
    icon: Globe,
    subsections: [
      { id: "seo-ayarlari", title: "SEO Ayarları" },
      { id: "sitemap", title: "Sitemap" },
      { id: "meta", title: "Meta Tag Yönetimi" },
    ],
  },
];

const Documentation = () => {
  const [activeSection, setActiveSection] = useState("hakkinda");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Dokümantasyon - Dijital Ürün Satış Platformu</title>
        <meta
          name="description"
          content="Kapsamlı dijital ürün satış platformu dokümantasyonu. Kurulum, kullanım ve tüm özellikler hakkında detaylı bilgi."
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <div className="container mx-auto px-4 py-8 mt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Dokümantasyon</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dijital ürün satış platformunuz için kapsamlı kurulum ve kullanım kılavuzu
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Mobile Menu Toggle */}
            <div className="lg:hidden">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="w-4 h-4 mr-2" />
                ) : (
                  <Menu className="w-4 h-4 mr-2" />
                )}
                {mobileMenuOpen ? "Menüyü Kapat" : "Menüyü Aç"}
              </Button>
            </div>

            {/* Sidebar Navigation */}
            <div
              className={`lg:col-span-3 ${mobileMenuOpen ? "block" : "hidden lg:block"
                }`}
            >
              <Card className="sticky top-24">
                <ScrollArea className="h-[calc(100vh-8rem)]">
                  <div className="p-4 space-y-2">
                    {sections.map((section) => (
                      <div key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={`flex items-center gap-2 w-full text-left p-2 rounded-lg hover:bg-accent transition-colors ${activeSection === section.id
                              ? "bg-accent font-medium"
                              : ""
                            }`}
                        >
                          <section.icon className="w-4 h-4" />
                          <span>{section.title}</span>
                        </button>
                        {section.subsections && (
                          <div className="ml-6 mt-1 space-y-1">
                            {section.subsections.map((subsection) => (
                              <button
                                key={subsection.id}
                                onClick={() => scrollToSection(subsection.id)}
                                className={`block w-full text-left text-sm p-1.5 rounded hover:bg-accent/50 transition-colors ${activeSection === subsection.id
                                    ? "text-primary font-medium"
                                    : "text-muted-foreground"
                                  }`}
                              >
                                {subsection.title}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-9">
              <div className="prose prose-slate dark:prose-invert max-w-none">
                {/* Giriş Section */}
                <section id="giris" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Giriş</h2>

                  <div id="hakkinda" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Script Hakkında</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p className="mb-4">
                          Bu dijital ürün satış platformu, modern web teknolojileri kullanılarak
                          geliştirilmiş, tam özellikli bir e-ticaret çözümüdür. React, TypeScript,
                          Tailwind CSS ve Metahub altyapısı ile güçlendirilmiştir.
                        </p>
                        <p>
                          Platform, oyun içi eşyalar, dijital kodlar, sosyal medya hizmetleri,
                          oyun içi para yüklemeleri ve daha fazlası gibi dijital ürünlerin satışı
                          için özel olarak tasarlanmıştır.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="ozellikler" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Temel Özellikler</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardContent className="pt-6">
                          <Package className="w-8 h-8 mb-3 text-primary" />
                          <h4 className="font-semibold mb-2">Ürün Yönetimi</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Sınırsız ürün ve kategori</li>
                            <li>• Çoklu görsel galerisi</li>
                            <li>• Stok takibi</li>
                            <li>• Özelleştirilebilir alanlar</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <CreditCard className="w-8 h-8 mb-3 text-primary" />
                          <h4 className="font-semibold mb-2">Ödeme Sistemleri</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Shopier entegrasyonu</li>
                            <li>• PayTR entegrasyonu</li>
                            <li>• Havale/EFT bildirimi</li>
                            <li>• Cüzdan sistemi</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <Zap className="w-8 h-8 mb-3 text-primary" />
                          <h4 className="font-semibold mb-2">API Entegrasyonları</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Turkpin API (Epin/TopUp)</li>
                            <li>• SMM Panel API</li>
                            <li>• Otomatik teslimat</li>
                            <li>• Sipariş takibi</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <BarChart className="w-8 h-8 mb-3 text-primary" />
                          <h4 className="font-semibold mb-2">Pazarlama Araçları</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Kupon sistemi</li>
                            <li>• Pop-up kampanyaları</li>
                            <li>• Sahte sipariş bildirimleri</li>
                            <li>• E-posta kampanyaları</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <Shield className="w-8 h-8 mb-3 text-primary" />
                          <h4 className="font-semibold mb-2">Güvenlik</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• Row Level Security (RLS)</li>
                            <li>• Rol bazlı yetkilendirme</li>
                            <li>• Güvenli kimlik doğrulama</li>
                            <li>• API güvenliği</li>
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardContent className="pt-6">
                          <Globe className="w-8 h-8 mb-3 text-primary" />
                          <h4 className="font-semibold mb-2">SEO & Performans</h4>
                          <ul className="text-sm space-y-1 text-muted-foreground">
                            <li>• SEO uyumlu yapı</li>
                            <li>• Otomatik sitemap</li>
                            <li>• Meta tag yönetimi</li>
                            <li>• Hızlı yükleme</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <div id="gereksinimler" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Sistem Gereksinimleri</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <h4 className="font-semibold mb-3">Hosting Gereksinimleri</h4>
                        <ul className="space-y-2 text-muted-foreground mb-4">
                          <li>• Node.js 18+ veya hosting desteği</li>
                          <li>• Metahub hesabı (ücretsiz plan yeterli)</li>
                          <li>• Modern web tarayıcısı</li>
                        </ul>

                        <Separator className="my-4" />

                        <h4 className="font-semibold mb-3">Önerilen Altyapı</h4>
                        <ul className="space-y-2 text-muted-foreground">
                          <li>• Lovable.dev (önerilen)</li>
                          <li>• Vercel / Netlify</li>
                          <li>• CloudFlare Pages</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Kurulum Section */}
                <section id="kurulum" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Kurulum</h2>

                  <div id="baslangic" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Başlangıç</h3>
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">1. Projeyi İndirin</h4>
                          <p className="text-sm text-muted-foreground">
                            Satın aldığınız dosyaları bilgisayarınıza indirin ve arşivden çıkarın.
                          </p>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">2. Lovable.dev'e Aktarın</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            En kolay yöntem Lovable.dev kullanmaktır:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Lovable.dev hesabı oluşturun</li>
                            <li>• Yeni proje oluşturun</li>
                            <li>• Dosyaları GitHub'a yükleyin</li>
                            <li>• Lovable ile GitHub'ı bağlayın</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="veritabani" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Veritabanı Kurulumu</h3>
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Platform Lovable Cloud kullanıyorsa, veritabanı otomatik olarak
                          kurulmuştur. Migration dosyaları otomatik çalıştırılır.
                        </p>
                        <div>
                          <h4 className="font-semibold mb-2">Manuel Kurulum (Gerekirse)</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Metahub Dashboard'a gidin</li>
                            <li>• SQL Editor'ı açın</li>
                            <li>• metahub/migrations klasöründeki dosyaları sırayla çalıştırın</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="yapilandirma" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Yapılandırma</h3>
                    <Card>
                      <CardContent className="pt-6 space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">1. Admin Hesabı Oluşturma</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            İlk kullanıcı kaydı otomatik olarak admin yetkisi alır. Kayıt olduktan
                            sonra:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• /giris sayfasından giriş yapın</li>
                            <li>• /admin adresine gidin</li>
                            <li>• Admin paneline erişiminiz olacak</li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold mb-2">2. Site Ayarları</h4>
                          <p className="text-sm text-muted-foreground">
                            Admin Panel → Ayarlar bölümünden site bilgilerinizi güncelleyin:
                          </p>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            <li>• Site adı ve logosu</li>
                            <li>• İletişim bilgileri</li>
                            <li>• Sosyal medya linkleri</li>
                            <li>• SEO ayarları</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Ürün Yönetimi Section */}
                <section id="urun-yonetimi" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Ürün Yönetimi</h2>

                  <div id="urun-ekleme" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Ürün Ekleme</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Admin panelinden yeni ürün ekleyebilir, ürün adı, açıklaması, fiyatı ve
                          görsellerini belirleyebilirsiniz. Ürün tipine göre özel alanlar ekleyebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="kategoriler" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Kategori Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Ürünlerinizi kategorilere ayırarak düzenleyebilir, kategori ekleyip
                          düzenleyebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="stok" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Stok Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Ürün stoklarını takip edebilir, stok bitince otomatik olarak satışa kapatabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="urun-tipleri" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Ürün Tipleri</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Dijital kodlar, oyun içi para, sosyal medya hizmetleri gibi farklı ürün tipleri desteklenir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Ödeme Sistemleri Section */}
                <section id="odeme-sistemleri" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Ödeme Sistemleri</h2>

                  <div id="shopier" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Shopier Entegrasyonu</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Shopier ödeme sistemi ile kolay ve güvenli ödeme alabilirsiniz. API anahtarlarınızı admin panelinden ekleyin.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="paytr" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">PayTR Entegrasyonu</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          PayTR ile kredi kartı ve diğer ödeme yöntemlerini destekleyebilirsiniz. Ayarlar bölümünden entegrasyon yapabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="havale" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Havale/EFT</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Müşterileriniz havale/EFT ile ödeme yapabilir, ödeme onayı admin tarafından manuel olarak verilir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="wallet" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Cüzdan Sistemi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Kullanıcılar cüzdanlarına bakiye yükleyebilir, bakiye ile alışveriş yapabilirler.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* API Entegrasyonları Section */}
                <section id="api-entegrasyonlari" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">API Entegrasyonları</h2>

                  <div id="smm-api" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">SMM Panel API</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Sosyal medya hizmetleri için SMM panel API entegrasyonu yapılmıştır. Siparişler otomatik olarak işlenir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="turkpin" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Turkpin API</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Turkpin API ile oyun içi para yüklemeleri ve epin satışları yapılabilir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="api-yonetimi" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">API Sağlayıcı Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Admin panelinden API sağlayıcılar ekleyip düzenleyebilirsiniz. Siparişler ilgili API'ye yönlendirilir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Kullanıcı Yönetimi Section */}
                <section id="kullanici-yonetimi" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Kullanıcı Yönetimi</h2>

                  <div id="kayit-giris" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Kayıt ve Giriş</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Kullanıcılar e-posta ile kayıt olabilir, sosyal medya hesapları ile giriş yapabilirler.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="roller" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Roller ve Yetkiler</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Admin panelinden kullanıcı rolleri ve yetkileri yönetilebilir. Yetkilendirme sistemi RLS ile desteklenir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="profil" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Profil Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Kullanıcılar profil bilgilerini güncelleyebilir, şifre değiştirebilirler.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Sipariş Yönetimi Section */}
                <section id="siparis-yonetimi" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Sipariş Yönetimi</h2>

                  <div id="siparis-akisi" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Sipariş Akışı</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Kullanıcı sipariş verir, ödeme onayı alınır, ürün otomatik veya manuel olarak teslim edilir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="teslimat" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Teslimat Türleri</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Dijital ürün teslimatı otomatik, fiziksel ürünler için manuel teslimat seçenekleri mevcuttur.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="durum-takibi" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Durum Takibi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Sipariş durumu kullanıcı ve admin tarafından takip edilebilir, durum güncellemeleri yapılabilir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Blog & İçerik Section */}
                <section id="blog-icerik" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Blog & İçerik</h2>

                  <div id="blog-yonetimi" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Blog Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Admin panelinden blog yazıları oluşturabilir, düzenleyebilir ve yayınlayabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="ozel-sayfalar" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Özel Sayfalar</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Hakkımızda, iletişim gibi özel sayfalar oluşturabilir ve içeriklerini yönetebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="menu" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Menü Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Site menülerini admin panelinden kolayca düzenleyebilir, yeni menü öğeleri ekleyebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Pazarlama Araçları Section */}
                <section id="pazarlama" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Pazarlama Araçları</h2>

                  <div id="kuponlar" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Kupon Sistemi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Kupon kodları oluşturabilir, indirim kampanyaları yapabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="popup" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Pop-up Kampanyaları</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Siteye giriş yapan kullanıcılara özel pop-up kampanyaları gösterebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="fake-bildirim" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Sahte Bildirimler</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Satışları artırmak için sahte sipariş bildirimleri gösterebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="topbar" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Üst Bildirim Çubuğu</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Önemli duyuruları göstermek için üst bildirim çubuğu kullanabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Destek Sistemi Section */}
                <section id="destek" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Destek Sistemi</h2>

                  <div id="ticket" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Ticket Sistemi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Kullanıcılar destek talepleri oluşturabilir, admin panelinden takip edebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="mail-sablonlari" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">E-posta Şablonları</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Otomatik e-posta bildirimleri için şablonlar oluşturabilir ve düzenleyebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="bildirimler" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Bildirim Sistemi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Site içi bildirimler ile kullanıcıları bilgilendirebilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* Güvenlik Section */}
                <section id="guvenlik" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">Güvenlik</h2>

                  <div id="rls" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Row Level Security</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Metahub RLS ile veri güvenliği sağlanır, kullanıcılar sadece yetkili oldukları verilere erişir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="auth" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Kimlik Doğrulama</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Güvenli kimlik doğrulama sistemi ile kullanıcı hesapları korunur.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="roller-yetki" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Rol Bazlı Yetkilendirme</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Admin panelinden kullanıcı rolleri ve yetkileri detaylı şekilde yönetilebilir.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>

                {/* SEO & Optimizasyon Section */}
                <section id="seo" className="mb-16">
                  <h2 className="text-3xl font-bold mb-6">SEO & Optimizasyon</h2>

                  <div id="seo-ayarlari" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">SEO Ayarları</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Site başlığı, açıklaması ve diğer SEO ayarlarını admin panelinden yapabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="sitemap" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Sitemap</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Otomatik sitemap oluşturma ile arama motorları için site haritası sağlanır.
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div id="meta" className="mb-8">
                    <h3 className="text-2xl font-semibold mb-4">Meta Tag Yönetimi</h3>
                    <Card>
                      <CardContent className="pt-6">
                        <p>
                          Sayfa bazlı meta tag yönetimi ile SEO performansınızı artırabilirsiniz.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
};

export default Documentation;
