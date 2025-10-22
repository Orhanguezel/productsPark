import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PaymentIframe = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState<string>("");
  const [orderId, setOrderId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("card");

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const orderIdParam = searchParams.get("order_id");
    const typeParam = searchParams.get("type");
    
    if (!tokenParam || !orderIdParam) {
      navigate("/sepet");
      return;
    }

    setToken(tokenParam);
    setOrderId(orderIdParam);
    setPaymentType(typeParam || "card");

    // Load PayTR iframe resizer script
    const script = document.createElement("script");
    script.src = "https://www.paytr.com/js/iframeResizer.min.js";
    script.async = true;
    script.onload = () => {
      // Initialize iframe resizer after script loads
      if ((window as any).iFrameResize) {
        (window as any).iFrameResize({
          log: false,
          checkOrigin: false,
          heightCalculationMethod: 'bodyScroll',
          scrolling: true,
          autoResize: true,
          sizeHeight: true,
          sizeWidth: false,
          tolerance: 10
        }, '#paytriframe');
      }
    };
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [searchParams, navigate]);

  if (!token) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/sepet")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sepete Dön
          </Button>

          <Card>
            <CardHeader>
              <CardTitle>{paymentType === "havale" ? "Havale/EFT Bilgileri" : "Güvenli Ödeme"}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sipariş No: {orderId}
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="bg-muted/30 rounded-lg overflow-hidden">
                <iframe 
                  src={paymentType === "havale" 
                    ? `https://www.paytr.com/odeme/havale/${token}`
                    : `https://www.paytr.com/odeme/guvenli/${token}`
                  }
                  id="paytriframe" 
                  frameBorder="0"
                  scrolling="no" 
                  style={{ 
                    width: '100%', 
                    minHeight: '600px',
                    border: 'none'
                  }}
                  title={paymentType === "havale" ? "PayTR Havale/EFT Bilgileri" : "PayTR Ödeme Formu"}
                  allow="payment"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Ödeme işleminiz güvenli PayTR altyapısı üzerinden gerçekleştirilmektedir.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentIframe;
