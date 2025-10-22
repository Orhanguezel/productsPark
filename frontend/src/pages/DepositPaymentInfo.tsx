import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, CheckCircle } from "lucide-react";

const DepositPaymentInfo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const amount = searchParams.get("amount");
  const [bankInfo, setBankInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!amount) {
      toast.error("Geçersiz işlem");
      navigate("/hesabim");
      return;
    }

    checkMinimumLimit();
  }, [amount]);

  const checkMinimumLimit = async () => {
    try {
      const { data: settingsData } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "min_balance_limit")
        .single();

      const minLimit = typeof settingsData?.value === 'number' ? settingsData.value : 10;
      const depositAmount = parseFloat(amount!);

      if (depositAmount < minLimit) {
        toast.error(`Minimum yükleme tutarı ${minLimit} ₺'dir`);
        navigate("/hesabim");
        return;
      }

      fetchBankInfo();
    } catch (error) {
      console.error("Error checking minimum limit:", error);
      fetchBankInfo();
    }
  };

  const fetchBankInfo = async () => {
    try {
      const { data: bankData } = await metahub
        .from("site_settings")
        .select("value")
        .eq("key", "bank_account_info")
        .single();

      if (bankData?.value) {
        setBankInfo(bankData.value);
      }
    } catch (error) {
      console.error("Error fetching bank info:", error);
      toast.error("Bilgiler yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Panoya kopyalandı");
  };

  const handlePaymentConfirm = async () => {
    setSubmitting(true);
    try {
      const { data: { user } } = await metahub.auth.getUser();
      if (!user) {
        toast.error("Oturum bulunamadı");
        return;
      }

      // Create deposit request
      const { data: depositData, error: depositError } = await metahub
        .from("wallet_deposit_requests")
        .insert({
          user_id: user.id,
          amount: parseFloat(amount!),
          payment_method: "havale",
          status: "pending",
        })
        .select()
        .single();

      if (depositError) throw depositError;

      // Send telegram notification
      try {
        console.log('Checking deposit telegram notification settings...');

        // Get user profile
        const { data: profile } = await metahub
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .single();

        const { data: telegramSettings } = await metahub
          .from("site_settings")
          .select("value")
          .eq("key", "new_deposit_request_telegram")
          .single();

        console.log('Deposit telegram settings:', telegramSettings);

        // Handle both boolean and string values
        const isEnabled = telegramSettings?.value === true || telegramSettings?.value === 'true';

        if (isEnabled && depositData) {
          console.log('Invoking deposit telegram notification...');
          const result = await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_deposit_request",
              depositId: depositData.id,
              amount: depositData.amount,
              userName: profile?.full_name || 'Kullanıcı',
            },
          });
          console.log('Deposit telegram notification result:', result);
        } else {
          console.log('Deposit telegram notification not sent - Enabled:', isEnabled);
        }
      } catch (telegramError) {
        console.error("Deposit telegram notification error:", telegramError);
      }

      toast.success("Ödeme bildirimi gönderildi");
      navigate("/hesabim");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <p className="text-center">Yükleniyor...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-primary" />
              Havale/EFT Bilgileri - Bakiye Yükleme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-4">
                Lütfen aşağıdaki hesap bilgilerine ödemenizi yapın ve "Ödemeyi Yaptım" butonuna tıklayın.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Yüklenecek Tutar</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">{amount} ₺</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(amount!)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {bankInfo && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <Label className="text-base font-semibold">Banka Hesap Bilgileri</Label>
                  <div className="whitespace-pre-wrap text-sm">{bankInfo}</div>
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Önemli:</strong> Ödeme açıklamasına adınızı ve soyadınızı yazın.
                </p>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePaymentConfirm}
                disabled={submitting}
              >
                {submitting ? "Gönderiliyor..." : "Ödemeyi Yaptım"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
};

export default DepositPaymentInfo;
