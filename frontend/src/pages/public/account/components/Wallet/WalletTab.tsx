// =============================================================
// FILE: src/pages/account/components/Wallet/WalletTab.tsx
// =============================================================
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
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

import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { useGetMyProfileQuery } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import {
  useListSiteSettingsQuery,
} from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";
import {
  useCreateOrderMutation,
  type CreateOrderBody,
} from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import type { WalletTransaction as WalletTxn } from "@/integrations/metahub/db/types/wallet";

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

const asBoolLoose = (v: unknown, d = false): boolean => {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").trim().toLowerCase();
  if (["1", "true", "yes", "y", "on", "enabled"].includes(s)) return true;
  if (["0", "false", "no", "n", "off", "disabled"].includes(s)) return false;
  return d;
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

  // ---- orders RTK (create) ----
  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | "">("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositing, setDepositing] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  // site_settings'ten min limit + ödeme ayarlarını türet
  const minLimit = useMemo(() => {
    if (!siteSettings) return 10;
    const row = siteSettings.find((s) => s.key === "min_balance_limit");
    return asNumber(row?.value, 10);
  }, [siteSettings]);

  useEffect(() => {
    if (!user || !siteSettings) return;

    const getVal = (key: string): unknown =>
      siteSettings.find((s) => s.key === key)?.value;

    const methods: PaymentMethod[] = [];

    // payment_methods JSON'u (iban vs)
    const paymentSettings = getVal("payment_methods");
    const getFromJson = <T,>(k: string, d: T): T =>
      paymentSettings && typeof paymentSettings === "object"
        ? ((paymentSettings as Record<string, unknown>)[k] as T) ?? d
        : d;

    // Havale
    if (getFromJson("havale_enabled", false)) {
      methods.push({
        id: "havale",
        name: "Havale",
        enabled: true,
        commission: 0,
        iban: getFromJson<string | undefined>("havale_iban", undefined),
        account_holder: getFromJson<string | undefined>("havale_account_holder", undefined),
        bank_name: getFromJson<string | undefined>("havale_bank_name", undefined),
      });
    }

    // EFT
    if (getFromJson("eft_enabled", false)) {
      methods.push({
        id: "eft",
        name: "EFT",
        enabled: true,
        commission: 0,
        iban: getFromJson<string | undefined>("eft_iban", undefined),
        account_holder: getFromJson<string | undefined>("eft_account_holder", undefined),
        bank_name: getFromJson<string | undefined>("eft_bank_name", undefined),
      });
    }

    // PayTR kart
    const paytrEnabled = asBoolLoose(getVal("paytr_enabled"), false);
    const paytrComm = asNumber(getVal("paytr_commission"), 0);
    if (paytrEnabled) {
      methods.push({
        id: "paytr",
        name: "Kredi Kartı (PayTR)",
        enabled: true,
        commission: paytrComm,
      });
    }

    // PayTR havale
    const paytrHavaleEnabled = asBoolLoose(getVal("paytr_havale_enabled"), false);
    const paytrHavaleComm = asNumber(getVal("paytr_havale_commission"), 0);
    if (paytrHavaleEnabled) {
      methods.push({
        id: "paytr_havale",
        name: "Havale/EFT (PayTR)",
        enabled: true,
        commission: paytrHavaleComm,
      });
    }

    // Shopier
    const shopierEnabled = asBoolLoose(getVal("shopier_enabled"), false);
    const shopierComm = asNumber(getVal("shopier_commission"), 0);
    if (shopierEnabled) {
      methods.push({
        id: "shopier",
        name: "Kredi Kartı (Shopier)",
        enabled: true,
        commission: shopierComm,
      });
    }

    setPaymentMethods(methods);
    if (!selectedPayment && methods.length > 0) {
      setSelectedPayment(methods[0].id);
    }
  }, [user, siteSettings, selectedPayment]);

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
      toast.error(`Minimum yükleme tutarı ${minLimit.toLocaleString("tr-TR")} ₺'dir`);
      return;
    }

    if (!selectedPayment) {
      toast.error("Ödeme yöntemi seçiniz");
      return;
    }

    if (selectedPayment === "paytr") await handlePayTRPayment();
    else if (selectedPayment === "shopier") await handleShopierPayment();
    else if (selectedPayment === "paytr_havale") await handlePayTRHavalePayment();
    else if (selectedPayment === "havale" || selectedPayment === "eft") {
      toast.success("Ödeme bilgilerine yönlendiriliyorsunuz...");
      window.location.href = `/bakiye-odeme-bilgileri?amount=${depositAmount}`;
    }
  };

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
        total: finalStr,       // karttan çekilecek (komisyonlu) tutar
      };

      const order = await createOrder(body).unwrap();

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke(
        "paytr-get-token",
        {
          body: {
            orderData: {
              merchant_oid: orderNumber,
              payment_amount: finalTotal,
              final_amount: finalTotal,
              order_id: order.id,
              items: [
                {
                  product_name: "Cüzdan Bakiye Yükleme",
                  quantity: 1,
                  total_price: amount,
                },
              ],
            },
            customerInfo: {
              name: profileData.full_name ?? "",
              email: user.email ?? "",
              phone: profileData.phone ?? "05000000000",
              address: "DİJİTAL ÜRÜN",
            },
          },
        }
      );

      if (tokenError || !tokenData?.success) {
        throw new Error(tokenData?.error || "Token alınamadı");
      }

      navigate(`/odeme-iframe?token=${tokenData.token}&order_id=${order.order_number}`);
    } catch (e) {
      console.error("PayTR payment error:", e);
      toast.error(e instanceof Error ? e.message : "Ödeme başlatılamadı");
    } finally {
      setDepositing(false);
    }
  };

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

      const { data: paymentData, error: paymentError } =
        await metahub.functions.invoke("shopier-create-payment", {
          body: {
            orderData: {
              merchant_oid: orderNumber,
              user_id: user.id,
              total_amount: amount,
              discount_amount: 0,
              final_amount: finalTotal,
              order_id: order.id,
              items: [
                {
                  product_name: "Cüzdan Bakiye Yükleme",
                  quantity: 1,
                  price: amount,
                  total_price: amount,
                },
              ],
            },
            customerInfo: {
              name: profileData.full_name ?? "",
              email: user.email ?? "",
              phone: profileData.phone ?? "05000000000",
            },
          },
        });

      if (paymentError || !paymentData?.success) {
        throw new Error(paymentData?.error || "Ödeme oluşturulamadı");
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = paymentData.form_action;
      Object.keys(paymentData.form_data).forEach((key) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(paymentData.form_data[key]);
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

      const { data: tokenData, error: tokenError } = await metahub.functions.invoke(
        "paytr-havale-get-token",
        {
          body: {
            orderData: {
              merchant_oid: orderNumber,
              payment_amount: amount,
              order_id: order.id,
              items: [
                {
                  product_name: "Cüzdan Bakiye Yükleme",
                  quantity: 1,
                  total_price: amount,
                },
              ],
            },
            customerInfo: {
              name: profileData.full_name ?? "",
              email: user.email ?? "",
              phone: profileData.phone ?? "05000000000",
              address: "DİJİTAL ÜRÜN",
            },
          },
        }
      );

      if (tokenError || !tokenData?.success) {
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
            {settingsLoading ? (
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
                  onValueChange={(v) =>
                    setSelectedPayment(v as PaymentMethodId)
                  }
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
                                  parseFloat(depositAmount) + commissionAmount
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
                        txn.amount > 0 ? "text-green-600" : "text-red-600"
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
