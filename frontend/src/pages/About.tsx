import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Zap, HeadphonesIcon, Award, Users, Target } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— Hakkımızda</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Dijital Dünyanın Güvenilir Adresi
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            2020'den beri binlerce müşteriye güvenli ve kaliteli dijital ürünler sunuyoruz
          </p>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6">Hikayemiz</h2>
              <p className="text-muted-foreground mb-4">
                Dijital Market olarak 2020 yılında başladığımız bu yolculukta, 
                müşterilerimize en kaliteli dijital ürünleri en uygun fiyatlarla 
                sunmayı hedefledik.
              </p>
              <p className="text-muted-foreground mb-4">
                Oyun lisanslarından yazılım aktivasyonlarına, tasarım araçlarından 
                eğitim platformlarına kadar geniş bir ürün yelpazesiyle hizmet veriyoruz. 
                Her geçen gün büyüyen müşteri kitlemiz ve %98 memnuniyet oranımız ile 
                sektörün lider platformlarından biri olduk.
              </p>
              <p className="text-muted-foreground">
                Müşteri memnuniyeti odaklı yaklaşımımız, 7/24 destek hizmetimiz ve 
                %100 orijinal ürün garantimiz ile fark yaratmaya devam ediyoruz.
              </p>
            </div>
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop"
                alt="Takım Çalışması"
                className="rounded-lg shadow-elegant"
              />
            </div>
          </div>

          {/* Values */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12">Değerlerimiz</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Güvenilirlik</h3>
                <p className="text-muted-foreground">
                  %100 orijinal ürünler ve güvenli ödeme sistemleri
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Hızlı Teslimat</h3>
                <p className="text-muted-foreground">
                  Anında dijital teslimat ile zaman kaybetmeyin
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <HeadphonesIcon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">7/24 Destek</h3>
                <p className="text-muted-foreground">
                  Her zaman yanınızdayız, sorunlarınızı çözüyoruz
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Award className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Kalite</h3>
                <p className="text-muted-foreground">
                  Sadece güvenilir kaynaklardan temin edilen ürünler
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Müşteri Odaklılık</h3>
                <p className="text-muted-foreground">
                  Müşteri memnuniyeti bizim önceliğimiz
                </p>
              </Card>

              <Card className="text-center p-6 hover:shadow-elegant transition-all duration-300">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Şeffaflık</h3>
                <p className="text-muted-foreground">
                  Açık ve net iletişim, gizli ücret yok
                </p>
              </Card>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            <Card className="text-center p-8 gradient-primary text-white">
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-white/90">Mutlu Müşteri</div>
            </Card>
            <Card className="text-center p-8 bg-secondary">
              <div className="text-4xl font-bold mb-2 text-primary">643</div>
              <div className="text-muted-foreground">Dijital Ürün</div>
            </Card>
            <Card className="text-center p-8 bg-accent text-accent-foreground">
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-accent-foreground/80">Memnuniyet Oranı</div>
            </Card>
            <Card className="text-center p-8 gradient-primary text-white">
              <div className="text-4xl font-bold mb-2">7/24</div>
              <div className="text-white/90">Destek Hizmeti</div>
            </Card>
          </div>

          {/* Mission */}
          <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">Misyonumuz</h2>
              <p className="text-lg text-muted-foreground">
                Dijital dünyada güvenilir, hızlı ve kaliteli hizmet sunarak 
                müşterilerimizin dijital ihtiyaçlarını karşılamak ve 
                onlara en iyi alışveriş deneyimini yaşatmak.
              </p>
            </div>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;