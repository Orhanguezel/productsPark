// =============================================================
// FILE: src/pages/account/DepositPaymentInfo.tsx  (public)
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Copy, CheckCircle } from "lucide-react";

import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useGetSiteSettingByKeyQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import {
  useCreateWalletDepositRequestMutation,
} from "@/integrations/metahub/rtk/endpoints/wallet.endpoints";
import {
  useGetMyProfileQuery,
} from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";

/* ---------------- helpers (no-any) ---------------- */
const asNumber = (v: unknown, d = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const asString = (v: unknown, d = ""): string => (v == null ? d : String(v));

const asBoolLoose = (v: unknown, d = false): boolean => {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "y", "on", "enabled"].includes(s)) return true;
  if (["0", "false", "no", "n", "off", "disabled"].includes(s)) return false;
  return d;
};

/* ---------------- component ---------------- */
export default function DepositPaymentInfo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const amountParam = searchParams.get("amount") ?? "";
  const amount = useMemo<number>(() => {
    const n = Number(amountParam.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }, [amountParam]);

  const [bankInfo, setBankInfo] = useState<string | null>(null);
  const [minLimit, setMinLimit] = useState<number>(10);
  const [tgEnabled, setTgEnabled] = useState<boolean>(false);

  const [
    createWalletDepositRequest,
    { isLoading: creatingDeposit },
  ] = useCreateWalletDepositRequestMutation();

  // ---- site_settings RTK ----
  const {
    data: minSetting,
    isLoading: minLoading,
  } = useGetSiteSettingByKeyQuery("min_balance_limit");
  const {
    data: bankSetting,
    isLoading: bankLoading,
  } = useGetSiteSettingByKeyQuery("bank_account_info");
  const {
    data: tgSetting,
    isLoading: tgLoading,
  } = useGetSiteSettingByKeyQuery("new_deposit_request_telegram");

  // ---- profile RTK ----
  const { data: meProfile } = useGetMyProfileQuery(undefined, {
    skip: !user, // user yokken çağırma
  });

  const settingsReady = !minLoading && !bankLoading && !tgLoading;
  const loading = authLoading || !settingsReady;

  useEffect(() => {
    // amount yok/bozuksa güvenli çık
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Geçersiz tutar");
      navigate("/hesabim");
      return;
    }

    // ayarlar henüz gelmediyse bekle
    if (!settingsReady) return;

    const min = asNumber(minSetting?.value, 10);
    const bank = asString(bankSetting?.value, "");
    const tg = asBoolLoose(tgSetting?.value, false);

    setMinLimit(min);
    setBankInfo(bank || null);
    setTgEnabled(tg);

    if (amount < min) {
      toast.error(`Minimum yükleme tutarı ${min.toLocaleString("tr-TR")} ₺'dir`);
      navigate("/hesabim");
      return;
    }
  }, [amount, settingsReady, minSetting, bankSetting, tgSetting, navigate]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Panoya kopyalandı");
    } catch {
      // Eski tarayıcı fallback
      const ok = (document.execCommand as any)?.("copy");
      if (ok) toast.success("Panoya kopyalandı");
      else toast.error("Kopyalama başarısız");
    }
  };

  const handlePaymentConfirm = async () => {
    if (!user) {
      toast.error("Oturum bulunamadı");
      navigate("/giris");
      return;
    }

    try {
      // 1) Cüzdan yükleme isteğini wallet API üzerinden oluştur
      const created = await createWalletDepositRequest({
        user_id: user.id, // BE JWT'den de alıyor; burada aynı id'yi gönderiyoruz
        amount,
        payment_method: "havale",
      }).unwrap();

      // 2) (Opsiyonel) Telegram bildirimi
      if (tgEnabled && created) {
        try {
          const userName = meProfile?.full_name || "Kullanıcı";

          await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_deposit_request",
              depositId: created.id,
              amount: created.amount,
              userName,
            },
          });
        } catch (e) {
          console.error("Telegram notify error:", e);
        }
      }

      toast.success("Ödeme bildirimi gönderildi");
      navigate("/hesabim");
    } catch (e) {
      console.error("Deposit create error:", e);
      toast.error("Bir hata oluştu");
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
                Lütfen aşağıdaki hesap bilgilerine ödemenizi yapın ve{" "}
                &quot;Ödemeyi Yaptım&quot; butonuna tıklayın.
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Yüklenecek Tutar</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">
                    {amount.toLocaleString("tr-TR")} ₺
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(String(amount))}
                    aria-label="Tutarı kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum tutar: {minLimit.toLocaleString("tr-TR")} ₺
                </p>
              </div>

              <Separator />

              {bankInfo && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <Label className="text-base font-semibold">Banka Hesap Bilgileri</Label>
                  <div className="whitespace-pre-wrap text-sm">{bankInfo}</div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(bankInfo)}
                      aria-label="Banka bilgilerini kopyala"
                    >
                      Tamamını Kopyala
                    </Button>
                  </div>
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
                disabled={creatingDeposit}
              >
                {creatingDeposit ? "Gönderiliyor..." : "Ödemeyi Yaptım"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
