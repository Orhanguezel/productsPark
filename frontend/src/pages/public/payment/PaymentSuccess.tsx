// =============================================================
// FILE: src/pages/account/components/PaymentSuccess.tsx
// =============================================================
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processing, setProcessing] = useState(true);

  useEffect(() => {
    const processShopierCallback = async () => {
      // Shopier callback parametreleri
      const platformOrderId = searchParams.get("platform_order_id");
      const status = searchParams.get("status");
      const paymentId = searchParams.get("payment_id");
      const signature = searchParams.get("signature");
      const randomNr = searchParams.get("random_nr");
      const apiKey = searchParams.get("API_key");

      if (platformOrderId && status && paymentId && signature) {
        console.log("Shopier callback received", {
          platformOrderId,
          status,
        });

        try {
          // Backend'deki /functions/shopier-callback endpoint'ine POST at
          const res = await fetch("/functions/shopier-callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              platform_order_id: platformOrderId,
              status,
              payment_id: paymentId,
              signature,
              random_nr: randomNr,
              API_key: apiKey,
            }),
          });

          if (!res.ok) {
            console.error(
              "Shopier callback error: HTTP",
              res.status,
              res.statusText
            );
          } else {
            const data = await res.json().catch(() => null);
            console.log("Shopier callback response:", data);
          }
        } catch (error) {
          console.error("Shopier callback error:", error);
        }
      }

      // Local state + storage temizliği
      setProcessing(false);
      sessionStorage.removeItem("checkoutData");
      sessionStorage.removeItem("havalepaymentData");
      localStorage.removeItem("guestCart");
    };

    void processShopierCallback();
  }, [searchParams]);

  if (processing) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Ödeme işleniyor...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="container mx-auto px-4 max-w-2xl">
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>

              <h1 className="text-3xl font-bold mb-4">Ödeme Başarılı!</h1>

              <p className="text-muted-foreground mb-8">
                Siparişiniz başarıyla oluşturuldu. Ödemeniz alındı ve
                siparişiniz işleme alındı.
              </p>

              <div className="bg-muted p-4 rounded-lg mb-8 text-sm">
                <p className="mb-2">
                  Sipariş detaylarınızı ve aktivasyon kodlarınızı hesabınızdan
                  görüntüleyebilirsiniz.
                </p>
                <p>E-posta adresinize sipariş onay maili gönderildi.</p>
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
                  onClick={() => navigate("/urunler")}
                  size="lg"
                  variant="outline"
                >
                  Alışverişe Devam Et
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

export default PaymentSuccess;
