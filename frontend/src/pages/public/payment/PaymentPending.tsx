import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";

const PaymentPending = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any checkout data
    sessionStorage.removeItem('checkoutData');
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-12 h-12 text-yellow-600" />
              </div>
              
              <h1 className="text-3xl font-bold mb-4">Ödeme Bildiriminiz Alındı</h1>
              
              <p className="text-muted-foreground mb-8">
                Ödeme dekontu başarıyla yüklendi. Ödemeniz onaylandıktan sonra siparişiniz işleme alınacaktır.
              </p>

              <div className="bg-muted p-4 rounded-lg mb-8 text-sm">
                <p className="mb-2 font-semibold">
                  Ödeme onayı genellikle 1-24 saat içinde tamamlanır.
                </p>
                <p className="mb-2">
                  Ödemeniz onaylandığında e-posta ile bilgilendirileceksiniz.
                </p>
                <p>
                  Sipariş durumunuzu hesabınızdan takip edebilirsiniz.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={() => navigate("/hesabim")}
                  size="lg"
                  className="gradient-primary"
                >
                  Siparişlerimi Görüntüle
                </Button>
                <Button
                  onClick={() => navigate("/")}
                  size="lg"
                  variant="outline"
                >
                  Ana Sayfaya Dön
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentPending;
