// =============================================================
// FILE: src/pages/account/components/Wallet/WalletTab.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import { useGetMyProfileQuery } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import { useListSiteSettingsQuery } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import {
  useCreateOrderMutation,
  type CreateOrderBody,
} from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import type { WalletTransaction as WalletTxn } from "@/integrations/metahub/rtk/types/wallet";
import { useListPaymentProvidersQuery } from "@/integrations/metahub/rtk/endpoints/payment_providers.endpoints";
import {
  usePaytrGetTokenMutation,
  usePaytrHavaleGetTokenMutation,
  useShopierCreatePaymentMutation,
} from "@/integrations/metahub/rtk/endpoints/functions.endpoints";

type PaymentMethodId = "havale" | "eft" | "paytr" | "paytr_havale" | "shopier";

type PaymentMethod = {
  id: PaymentMethodId;
  name: string;
  enabled: boolean;
  commission: number; // %
  iban?: string;
  account_holder?: string;
  bank_name?: string;
};

const itemsPerPage = 10;
const WALLET_PRODUCT_ID = "00000000-0000-0000-0000-000000000000"; // sanal UUID

/* ---------- helpers ---------- */
const asNumber = (v: unknown, d = 0): number => {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(",", "."));
    return Number.isFinite(n) ? n : d;
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : d;
};

export function WalletTab({
  txns,
  txLoading,
}: {
  txns: WalletTxn[];
  txLoading?: boolean;
}) {
  const { user } = useAuth();
  const { data: profileData } = useGetMyProfileQuery();
  const navigate = useNavigate();

  // ---- site_settings RTK ----
  const {
    data: siteSettings,
    isLoading: settingsLoading,
  } = useListSiteSettingsQuery(undefined);

  // ---- payment_providers RTK (PUBLIC) ----
  const {
    data: providers = [],
    isLoading: providersLoading,
  } = useListPaymentProvidersQuery();

  // ---- orders RTK (create) ----
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();

  // ---- functions RTK ----
  const [paytrGetToken] = usePaytrGetTokenMutation();
  const [paytrHavaleGetToken] = usePaytrHavaleGetTokenMutation();
  const [shopierCreatePayment] = useShopierCreatePaymentMutation();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | "">(
    ""
  );
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  // site_settings'ten min limit türet
  const minLimit = useMemo(() => {
    if (!siteSettings) return 10;
    const row = siteSettings.find((s) => s.key === "min_balance_limit");
    return asNumber(row?.value, 10);
  }, [siteSettings]);

  // Ödeme yöntemlerini hem site_settings JSON'dan (havale/eft)
  // hem de PUBLIC payment_providers listesinden (paytr, shopier, paytr_havale) türet
  useEffect(() => {
    if (!user) return;

    const methods: PaymentMethod[] = [];

    // --------- 1) Havale / EFT detayları (site_settings.payment_methods JSON) ---------
    if (siteSettings) {
      const paymentMethodsRow = siteSettings.find(
        (s) => s.key === "payment_methods"
      );

      let cfg: Record<string, unknown> = {};
      const raw = paymentMethodsRow?.value;

      if (raw && typeof raw === "string") {
        try {
          cfg = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          cfg = {};
        }
      } else if (raw && typeof raw === "object") {
        cfg = raw as Record<string, unknown>;
      }

      const getFromCfg = <T,>(k: string, d: T): T =>
        (cfg[k] as T | undefined) ?? d;

      // Havale
      if (getFromCfg<boolean>("havale_enabled", false)) {
        methods.push({
          id: "havale",
          name: "Havale",
          enabled: true,
          commission: 0,
          iban: getFromCfg<string | undefined>("havale_iban", undefined),
          account_holder: getFromCfg<string | undefined>(
            "havale_account_holder",
            undefined
          ),
          bank_name: getFromCfg<string | undefined>(
            "havale_bank_name",
            undefined
          ),
        });
      }

      // EFT
      if (getFromCfg<boolean>("eft_enabled", false)) {
        methods.push({
          id: "eft",
          name: "EFT",
          enabled: true,
          commission: 0,
          iban: getFromCfg<string | undefined>("eft_iban", undefined),
          account_holder: getFromCfg<string | undefined>(
            "eft_account_holder",
            undefined
          ),
          bank_name: getFromCfg<string | undefined>("eft_bank_name", undefined),
        });
      }
    }

    // --------- 2) Kart / PayTR / Shopier / PayTR Havale (payment_providers PUBLIC) ---------
    providers
      .filter((p) => p.is_active)
      .forEach((p) => {
        const cfg = p.public_config ?? {};
        const commission = asNumber(
          (cfg as Record<string, unknown>).commission,
          0
        );

        if (p.key === "paytr") {
          methods.push({
            id: "paytr",
            name: p.display_name || "Kredi Kartı (PayTR)",
            enabled: true,
            commission,
          });
        } else if (p.key === "paytr_havale") {
          methods.push({
            id: "paytr_havale",
            name: p.display_name || "Havale/EFT (PayTR)",
            enabled: true,
            commission,
          });
        } else if (p.key === "shopier") {
          methods.push({
            id: "shopier",
            name: p.display_name || "Kredi Kartı (Shopier)",
            enabled: true,
            commission,
          });
        }
      });

    setPaymentMethods(methods);

    // Daha önce seçilen yöntem hala listede varsa koru, yoksa ilk aktif yöntemi seç
    setSelectedPayment((prev) => {
      if (prev && methods.some((m) => m.id === prev)) return prev;
      return methods[0]?.id ?? "";
    });
  }, [user?.id, siteSettings, providers]);

  /* ---------- Derived ---------- */
  const pagedTxns: WalletTxn[] = useMemo(() => {
    const start = (transactionsPage - 1) * itemsPerPage;
    return txns.slice(start, start + itemsPerPage);
  }, [txns, transactionsPage]);

  /* ---------- Deposit handlers ---------- */
  const handleDeposit = async () => {
    if (!user) {
      toast.error("Lütfen giriş yapın");
      navigate("/giris");
      return;
    }

    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Geçerli bir miktar girin");
      return;
    }

    const amount = parseFloat(depositAmount);
    if (amount < minLimit) {
      toast.error(
        `Minimum yükleme tutarı ${minLimit.toLocaleString("tr-TR")} ₺'dir`
      );
      return;
    }

    if (!selectedPayment) {
      toast.error("Ödeme yöntemi seçiniz");
      return;
    }

    if (selectedPayment === "paytr") await handlePayTRPayment();
    else if (selectedPayment === "shopier") await handleShopierPayment();
    else if (selectedPayment === "paytr_havale")
      await handlePayTRHavalePayment();
    else if (selectedPayment === "havale" || selectedPayment === "eft") {
      toast.success("Ödeme bilgilerine yönlendiriliyorsunuz...");
      window.location.href = `/bakiye-odeme-bilgileri?amount=${depositAmount}`;
    }
  };

  /* ---------- PayTR Card ---------- */
  const handlePayTRPayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    const paytrMethod = paymentMethods.find((m) => m.id === "paytr");
    const commissionRate = paytrMethod?.commission ?? 0;
    const commission = (amount * commissionRate) / 100;
    const finalTotal = amount + commission;

    const subtotalStr = amount.toFixed(2);
    const finalStr = finalTotal.toFixed(2);

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: "paytr",
        payment_status: "pending",
        notes: "Cüzdan bakiye yükleme",
        items: [
          {
            product_id: WALLET_PRODUCT_ID,
            product_name: "Cüzdan Bakiye Yükleme",
            quantity: 1,
            price: subtotalStr,
            total: subtotalStr,
            options: { type: "wallet_topup" },
          },
        ],
        subtotal: subtotalStr, // cüzdana yatacak tutar
        discount: "0.00",
        total: finalStr, // karttan çekilecek (komisyonlu) tutar
      };

      const order = await createOrder(body).unwrap();

      // PayTR backend: payment_amount kuruş cinsinden bekliyor
      const payment_amount_kurus = Math.round(finalTotal * 100);
      const basket = [
        ["Cüzdan Bakiye Yükleme", Math.round(amount * 100), 1],
      ] as [string, number, number][];

      const tokenData = await paytrGetToken({
        email: user.email ?? "",
        payment_amount: payment_amount_kurus,
        merchant_oid: orderNumber,
        user_ip: "127.0.0.1",
        installment: 0,
        no_installment: 1,
        max_installment: 0,
        currency: "TL",
        basket,
        lang: "tr",
      }).unwrap();

      if (!tokenData?.success || !tokenData.token) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      navigate(
        `/odeme-iframe?token=${tokenData.token}&order_id=${order.order_number}`
      );
    } catch (e) {
      console.error("PayTR payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

  /* ---------- Shopier ---------- */
  const handleShopierPayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    const shopierMethod = paymentMethods.find((m) => m.id === "shopier");
    const commissionRate = shopierMethod?.commission ?? 0;
    const commission = (amount * commissionRate) / 100;
    const finalTotal = amount + commission;

    const subtotalStr = amount.toFixed(2);
    const finalStr = finalTotal.toFixed(2);

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: "shopier",
        payment_status: "pending",
        notes: "Cüzdan bakiye yükleme",
        items: [
          {
            product_id: WALLET_PRODUCT_ID,
            product_name: "Cüzdan Bakiye Yükleme",
            quantity: 1,
            price: subtotalStr,
            total: subtotalStr,
            options: { type: "wallet_topup" },
          },
        ],
        subtotal: subtotalStr,
        discount: "0.00",
        total: finalStr,
      };

      const order = await createOrder(body).unwrap();

      // Şu an backend stub body'yi kullanmıyor; tip izin verdiği kadarıyla boş obje gönderiyoruz.
      const paymentData = await shopierCreatePayment({}).unwrap();

      if (!paymentData?.success || !paymentData.form_action || !paymentData.form_data) {
        throw new Error(paymentData?.error || "Ödeme oluşturulamadı");
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.form_action;

      Object.keys(paymentData.form_data).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(paymentData.form_data![key]);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch (e) {
      console.error("Shopier payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
      setDepositing(false);
    }
  };

  /* ---------- PayTR Havale ---------- */
  const handlePayTRHavalePayment = async () => {
    if (!user || !profileData) return;
    const amount = parseFloat(depositAmount);
    if (amount <= 0) return;

    const subtotalStr = amount.toFixed(2);

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;

      const body: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: "paytr_havale",
        payment_status: "pending",
        notes: "Cüzdan bakiye yükleme",
        items: [
          {
            product_id: WALLET_PRODUCT_ID,
            product_name: "Cüzdan Bakiye Yükleme",
            quantity: 1,
            price: subtotalStr,
            total: subtotalStr,
            options: { type: "wallet_topup" },
          },
        ],
        subtotal: subtotalStr,
        discount: "0.00",
        total: subtotalStr, // havale yöntemi → komisyon yok
      };

      const order = await createOrder(body).unwrap();

      const payment_amount_kurus = Math.round(amount * 100);
      const basket = [
        ["Cüzdan Bakiye Yükleme", Math.round(amount * 100), 1],
      ] as [string, number, number][];

      const tokenData = await paytrHavaleGetToken({
        email: user.email ?? "",
        payment_amount: payment_amount_kurus,
        merchant_oid: orderNumber,
        user_ip: "127.0.0.1",
        installment: 0,
        no_installment: 1,
        max_installment: 0,
        currency: "TL",
        basket,
        lang: "tr",
      }).unwrap();

      if (!tokenData?.success) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      navigate(`/odeme-beklemede?order_id=${order.order_number}`);
    } catch (e) {
      console.error("PayTR Havale payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

  /* ---------- Render ---------- */
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Bakiye Yükle</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Miktar (₺)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="100"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Minimum tutar: {minLimit.toLocaleString("tr-TR")} ₺
            </p>
          </div>

          <div className="space-y-4">
            <Label>Ödeme Yöntemi</Label>
            {settingsLoading || providersLoading ? (
              <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Ödeme ayarları yükleniyor…
              </div>
            ) : paymentMethods.length === 0 ? (
              <div className="p-4 bg-muted rounded-md text-center text-sm text-muted-foreground">
                Aktif ödeme yöntemi bulunamadı. Lütfen yönetici ile iletişime geçin.
              </div>
            ) : (
              <>
                <RadioGroup
                  value={selectedPayment}
                  onValueChange={(v) => setSelectedPayment(v as PaymentMethodId)}
                >
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center space-x-2"
                    >
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label
                        htmlFor={method.id}
                        className="flex-1 cursor-pointer"
                      >
                        {method.name}
                        {method.commission > 0 && (
                          <span className="text-sm text-muted-foreground ml-2">
                            (Komisyon: %{method.commission})
                          </span>
                        )}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {depositAmount && parseFloat(depositAmount) > 0 && (
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Yüklenecek Miktar:</span>
                      <span className="font-semibold">
                        ₺{parseFloat(depositAmount).toFixed(2)}
                      </span>
                    </div>
                    {(() => {
                      const selected = paymentMethods.find(
                        (m) => m.id === selectedPayment
                      );
                      const commission = selected?.commission ?? 0;
                      const commissionAmount =
                        (parseFloat(depositAmount) * commission) / 100;

                      if (commission > 0) {
                        return (
                          <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Komisyon (%{commission}):</span>
                              <span>₺{commissionAmount.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Toplam Ödenecek:</span>
                              <span>
                                ₺
                                {(
                                  parseFloat(depositAmount) +
                                  commissionAmount
                                ).toFixed(2)}
                              </span>
                            </div>
                          </>
                        );
                      }
                      return null;
                    })()}
                  </div>
                )}
              </>
            )}
          </div>

          <Button
            onClick={handleDeposit}
            className="w-full"
            disabled={
              depositing ||
              creatingOrder ||
              settingsLoading ||
              providersLoading ||
              paymentMethods.length === 0 ||
              !depositAmount ||
              parseFloat(depositAmount) <= 0 ||
              !selectedPayment
            }
          >
            {depositing || creatingOrder ? "İşleniyor..." : "Bakiye Yükle"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
        </CardHeader>
        <CardContent>
          {txns.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              İşlem geçmişi bulunmamaktadır.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                {pagedTxns.map((txn) => (
                  <div
                    key={txn.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <p className="font-medium">
                        {txn.description ?? "Cüzdan İşlemi"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleString("tr-TR")}
                      </p>
                    </div>
                    <p
                      className={`font-bold ${
                        txn.amount > 0
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {txn.amount > 0 ? "+" : ""}₺
                      {txn.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {Math.ceil(txns.length / itemsPerPage) > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() =>
                          setTransactionsPage((p) => Math.max(1, p - 1))
                        }
                        className={
                          transactionsPage === 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: Math.ceil(txns.length / itemsPerPage) },
                      (_, i) => i + 1
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setTransactionsPage(page)}
                          isActive={transactionsPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          setTransactionsPage((p) =>
                            Math.min(
                              Math.ceil(txns.length / itemsPerPage),
                              p + 1
                            )
                          )
                        }
                        className={
                          transactionsPage ===
                          Math.ceil(txns.length / itemsPerPage)
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
              {txLoading && (
                <div className="text-xs text-muted-foreground mt-2">
                  İşlemler yenileniyor…
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
