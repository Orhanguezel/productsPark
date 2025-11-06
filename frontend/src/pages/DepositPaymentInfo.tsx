// =============================================================
// FILE: src/pages/account/DepositPaymentInfo.tsx  (public)
// =============================================================
import { useEffect, useMemo, useState } from "react";
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

/* ---------------- helpers (no-any) ---------------- */
type SiteSettingRow = { key: string; value: unknown };

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
const findSetting = (rows: SiteSettingRow[] | null | undefined, key: string) =>
  (rows ?? []).find((r) => r.key === key)?.value;

/* ---------------- component ---------------- */
export default function DepositPaymentInfo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const amountParam = searchParams.get("amount") ?? "";
  const amount = useMemo<number>(() => {
    const n = Number(amountParam.replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }, [amountParam]);

  const [bankInfo, setBankInfo] = useState<string | null>(null);
  const [minLimit, setMinLimit] = useState<number>(10);
  const [tgEnabled, setTgEnabled] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    // amount yok/bozuksa güvenli çık
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error("Geçersiz tutar");
      navigate("/hesabim");
      return;
    }

    const run = async () => {
      try {
        // 1 sorguda tüm ayarları çek
        const { data, error } = await metahub
          .from("site_settings")
          .select("key,value")
          .in("key", ["min_balance_limit", "bank_account_info", "new_deposit_request_telegram"]);

        if (error) throw error;
        const rows = (data ?? []) as SiteSettingRow[];

        const min = asNumber(findSetting(rows, "min_balance_limit"), 10);
        const bank = asString(findSetting(rows, "bank_account_info"), "");
        const tg = asBoolLoose(findSetting(rows, "new_deposit_request_telegram"), false);

        setMinLimit(min);
        setBankInfo(bank || null);
        setTgEnabled(tg);

        if (amount < min) {
          toast.error(`Minimum yükleme tutarı ${min} ₺'dir`);
          navigate("/hesabim");
          return;
        }
      } catch (e) {
        console.error("Settings load error:", e);
        // Ayarlar gelmese de sayfayı göstermeye devam edelim (default min=10)
        if (amount < 10) {
          toast.error(`Minimum yükleme tutarı 10 ₺'dir`);
          navigate("/hesabim");
          return;
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [amount, navigate]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Panoya kopyalandı");
    } catch {
      // Eski tarayıcı fallback
      const ok = document.execCommand?.("copy");
      if (ok) toast.success("Panoya kopyalandı");
      else toast.error("Kopyalama başarısız");
    }
  };

  const handlePaymentConfirm = async () => {
    setSubmitting(true);
    try {
      const { data: auth } = await metahub.auth.getUser();
      const user = auth?.user;
      if (!user) {
        toast.error("Oturum bulunamadı");
        return;
      }

      // 1) İstek oluştur
      const { data: created, error: insErr } = await metahub
        .from("wallet_deposit_requests")
        .insert({
          user_id: user.id,
          amount, // number
          payment_method: "havale",
          status: "pending",
        })
        .select()
        .single();

      if (insErr) throw insErr;

      // 2) (Opsiyonel) Telegram bildirimi
      if (tgEnabled && created) {
        try {
          const { data: profile } = await metahub
            .from("profiles")
            .select("full_name")
            .eq("id", user.id)
            .single();

          await metahub.functions.invoke("send-telegram-notification", {
            body: {
              type: "new_deposit_request",
              depositId: created.id,
              amount: created.amount,
              userName: profile?.full_name || "Kullanıcı",
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
}
