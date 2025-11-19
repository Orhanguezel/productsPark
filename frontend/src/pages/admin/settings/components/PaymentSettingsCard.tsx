// =============================================================
// FILE: src/components/admin/settings/PaymentSettingsCard.tsx
// =============================================================
"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

import type { Dispatch, SetStateAction } from "react";
import type { SiteSettings } from "@/integrations/metahub/db/types/site";
import type { PaymentProviderRow } from "@/integrations/metahub/db/types/payments";
import {
  useListPaymentProvidersAdminQuery,
  useCreatePaymentProviderAdminMutation,
  useUpdatePaymentProviderAdminMutation,
  useDeletePaymentProviderAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/payment_providers_admin.endpoints";

type Props = {
  settings: SiteSettings;
  setSettings: Dispatch<SetStateAction<SiteSettings>>;
  origin: string;
  savingProvider?: boolean;
};

/** Küçük yardımcı tipler - config'leri daha rahat kullanmak için */
type PaytrPublicConfig = {
  mode?: string; // "test" | "live" | ...
  commission?: number;
  test_mode?: boolean;
};

type PaytrSecretConfig = {
  merchant_id?: string;
  merchant_key?: string;
  merchant_salt?: string;
};

type ShopierPublicConfig = {
  mode?: string;
  commission?: number;
};

type ShopierSecretConfig = {
  client_id?: string;
  client_secret?: string;
};

type PaparaSecretConfig = {
  api_key?: string;
};

const asObject = <T extends Record<string, unknown> = Record<string, unknown>>(
  v: unknown
): T => {
  if (!v) return {} as T;
  if (typeof v === "object" && !Array.isArray(v)) return v as T;
  return {} as T;
};

export default function PaymentSettingsCard({
  settings,
  setSettings,
  origin,
  savingProvider,
}: Props) {
  // ==================== Payment Providers (RTK) ====================
  const {
    data: providers = [],
    isLoading: providersLoading,
    isFetching: providersFetching,
  } = useListPaymentProvidersAdminQuery(undefined);

  const [createProvider, { isLoading: creatingProvider }] =
    useCreatePaymentProviderAdminMutation();
  const [updateProvider, { isLoading: updatingProvider }] =
    useUpdatePaymentProviderAdminMutation();
  const [deleteProvider, { isLoading: deletingProvider }] =
    useDeletePaymentProviderAdminMutation();

  const [newProviderKey, setNewProviderKey] = useState("");
  const [newProviderName, setNewProviderName] = useState("");

  const busy =
    providersLoading ||
    providersFetching ||
    creatingProvider ||
    updatingProvider ||
    deletingProvider ||
    savingProvider;

  const findProvider = (key: string): PaymentProviderRow | undefined =>
    providers.find((p) => p.key === key);

  const patchProvider = (
    provider: PaymentProviderRow,
    patch: Partial<PaymentProviderRow>
  ) => {
    if (!provider.id) return;
    updateProvider({ id: provider.id, body: patch });
  };

  const handleCreatePresetProvider = async (
    key: string,
    display_name: string,
    defaults?: Partial<PaymentProviderRow>
  ) => {
    await createProvider({
      key,
      display_name,
      is_active: true,
      public_config: defaults?.public_config ?? {},
      secret_config: defaults?.secret_config ?? {},
    });
  };

  // ========== SiteSettings içindeki nested payment_methods için helper ==========
  const updatePaymentMethods = (
    patch: Partial<NonNullable<SiteSettings["payment_methods"]>>
  ) => {
    setSettings((prev) => ({
      ...prev,
      payment_methods: {
        ...(prev.payment_methods || {}),
        ...patch,
      },
    }));
  };

  // ========== Özel provider kısayolları ==========
  const paytr = findProvider("paytr");
  const paytrHavale = findProvider("paytr_havale");
  const shopier = findProvider("shopier");
  const papara = findProvider("papara");

  // ========== LOCAL FORM STATE (inputlarda git-gel olmasın diye) ==========

  // --- PayTR ---
  const [paytrMerchantId, setPaytrMerchantId] = useState("");
  const [paytrMerchantKey, setPaytrMerchantKey] = useState("");
  const [paytrMerchantSalt, setPaytrMerchantSalt] = useState("");
  const [paytrCommission, setPaytrCommission] = useState("0");
  const [paytrTestModeLocal, setPaytrTestModeLocal] = useState(true);

useEffect(() => {
  if (!paytr) return;
  const pub = asObject<PaytrPublicConfig>(paytr.public_config);
  const sec = asObject<PaytrSecretConfig>(paytr.secret_config);

  setPaytrMerchantId(sec.merchant_id ?? "");
  setPaytrMerchantKey(sec.merchant_key ?? "");
  setPaytrMerchantSalt(sec.merchant_salt ?? "");
  setPaytrCommission(
    pub.commission != null ? String(pub.commission) : "0"
  );

  const isTest =
    pub.test_mode ??
    (pub.mode ? pub.mode === "test" : true);

  setPaytrTestModeLocal(isTest);
}, [paytr?.id, paytr?.public_config, paytr?.secret_config]);


  // --- PayTR Havale ---
  const [paytrHavaleCommission, setPaytrHavaleCommission] = useState("0");

  useEffect(() => {
    if (!paytrHavale) return;
    const pub = asObject<PaytrPublicConfig>(paytrHavale.public_config);
    setPaytrHavaleCommission(
      pub.commission != null ? String(pub.commission) : "0"
    );
  }, [paytrHavale?.id, paytrHavale?.public_config]);

  // --- Shopier ---
  const [shopierClientId, setShopierClientId] = useState("");
  const [shopierClientSecret, setShopierClientSecret] = useState("");
  const [shopierCommission, setShopierCommission] = useState("0");

  useEffect(() => {
    if (!shopier) return;
    const pub = asObject<ShopierPublicConfig>(shopier.public_config);
    const sec = asObject<ShopierSecretConfig>(shopier.secret_config);

    setShopierClientId(sec.client_id ?? "");
    setShopierClientSecret(sec.client_secret ?? "");
    setShopierCommission(
      pub.commission != null ? String(pub.commission) : "0"
    );
  }, [shopier?.id, shopier?.public_config, shopier?.secret_config]);

  // --- Papara ---
  const [paparaApiKey, setPaparaApiKey] = useState("");

  useEffect(() => {
    if (!papara) return;
    const sec = asObject<PaparaSecretConfig>(papara.secret_config);
    setPaparaApiKey(sec.api_key ?? "");
  }, [papara?.id, papara?.secret_config]);

  // ==================== RENDER ====================
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Yöntemleri</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Küçük status */}
        {busy && (
          <p className="text-xs text-muted-foreground">
            Ödeme sağlayıcıları güncelleniyor…
          </p>
        )}

        {/* ==================== PayTR ==================== */}
        <section className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">PayTR Entegrasyonu</h3>

            {!paytr && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  handleCreatePresetProvider("paytr", "PayTR Kredi Kartı", {
                    public_config: {
                      mode: "test",
                      test_mode: true,
                      commission: 0,
                    },
                    secret_config: {},
                  })
                }
              >
                PayTR sağlayıcısı oluştur
              </Button>
            )}
          </div>

          {paytr ? (
            <>
              <div className="space-y-4 pl-4 border-l-2 border-muted">
                <h4 className="font-medium">Mağaza Bilgileri</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paytr_merchant_id">Merchant ID</Label>
                    <Input
                      id="paytr_merchant_id"
                      type="text"
                      value={paytrMerchantId}
                      onChange={(e) => setPaytrMerchantId(e.target.value)}
                      onBlur={() => {
                        if (!paytr) return;
                        const sec = asObject<PaytrSecretConfig>(
                          paytr.secret_config
                        );
                        if (sec.merchant_id === paytrMerchantId) return;
                        patchProvider(paytr, {
                          secret_config: {
                            ...sec,
                            merchant_id: paytrMerchantId,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paytr_merchant_key">Merchant Key</Label>
                    <Input
                      id="paytr_merchant_key"
                      type="password"
                      value={paytrMerchantKey}
                      onChange={(e) => setPaytrMerchantKey(e.target.value)}
                      onBlur={() => {
                        if (!paytr) return;
                        const sec = asObject<PaytrSecretConfig>(
                          paytr.secret_config
                        );
                        if (sec.merchant_key === paytrMerchantKey) return;
                        patchProvider(paytr, {
                          secret_config: {
                            ...sec,
                            merchant_key: paytrMerchantKey,
                          },
                        });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paytr_merchant_salt">Merchant Salt</Label>
                    <Input
                      id="paytr_merchant_salt"
                      type="password"
                      value={paytrMerchantSalt}
                      onChange={(e) => setPaytrMerchantSalt(e.target.value)}
                      onBlur={() => {
                        if (!paytr) return;
                        const sec = asObject<PaytrSecretConfig>(
                          paytr.secret_config
                        );
                        if (sec.merchant_salt === paytrMerchantSalt) return;
                        patchProvider(paytr, {
                          secret_config: {
                            ...sec,
                            merchant_salt: paytrMerchantSalt,
                          },
                        });
                      }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Switch
                    id="paytr_test_mode"
                    checked={paytrTestModeLocal}
                    onCheckedChange={(checked) => {
                      setPaytrTestModeLocal(checked);
                      if (!paytr) return;
                      const pub = asObject<PaytrPublicConfig>(
                        paytr.public_config
                      );
                      patchProvider(paytr, {
                        public_config: {
                          ...pub,
                          test_mode: checked,
                          mode: checked ? "test" : pub.mode ?? "live",
                        },
                      });
                    }}
                  />
                  <Label htmlFor="paytr_test_mode">Test Modu</Label>
                </div>
              </div>

              {/* PayTR kart ödemesi */}
              <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="paytr_enabled"
                    checked={!!paytr.is_active}
                    onCheckedChange={(checked) =>
                      patchProvider(paytr, { is_active: checked })
                    }
                  />
                  <Label htmlFor="paytr_enabled" className="font-medium">
                    Kredi Kartı ile Ödeme (PayTR)
                  </Label>
                </div>

                {paytr.is_active && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="paytr_commission">
                      Ödeme Komisyonu (%)
                    </Label>
                    <Input
                      id="paytr_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={paytrCommission}
                      onChange={(e) => setPaytrCommission(e.target.value)}
                      onBlur={() => {
                        if (!paytr) return;
                        const pub = asObject<PaytrPublicConfig>(
                          paytr.public_config
                        );
                        const next = parseFloat(paytrCommission || "0") || 0;
                        if (pub.commission === next) return;
                        patchProvider(paytr, {
                          public_config: {
                            ...pub,
                            commission: next,
                          },
                        });
                      }}
                    />
                  </div>
                )}
              </div>

              {/* PayTR Havale/EFT (separate provider) */}
              <div className="space-y-4 pl-4 border-l-2 border-muted mt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    id="paytr_havale_enabled"
                    checked={!!paytrHavale?.is_active}
                    onCheckedChange={async (checked) => {
                      if (!paytrHavale) {
                        // yoksa oluştur
                        await handleCreatePresetProvider(
                          "paytr_havale",
                          "PayTR Havale/EFT",
                          {
                            public_config: { mode: "test", commission: 0 },
                          }
                        );
                      } else {
                        patchProvider(paytrHavale, { is_active: checked });
                      }
                    }}
                  />
                  <Label
                    htmlFor="paytr_havale_enabled"
                    className="font-medium"
                  >
                    PayTR Havale/EFT ile Ödeme
                  </Label>
                </div>

                {paytrHavale && paytrHavale.is_active && (
                  <div className="space-y-2 pl-6">
                    <Label htmlFor="paytr_havale_commission">
                      Havale/EFT Komisyonu (%)
                    </Label>
                    <Input
                      id="paytr_havale_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={paytrHavaleCommission}
                      onChange={(e) =>
                        setPaytrHavaleCommission(e.target.value)
                      }
                      onBlur={() => {
                        if (!paytrHavale) return;
                        const pub = asObject<PaytrPublicConfig>(
                          paytrHavale.public_config
                        );
                        const next =
                          parseFloat(paytrHavaleCommission || "0") || 0;
                        if (pub.commission === next) return;
                        patchProvider(paytrHavale, {
                          public_config: {
                            ...pub,
                            commission: next,
                          },
                        });
                      }}
                    />
                  </div>
                )}
              </div>

              <p className="text-sm text-muted-foreground mt-4">
                PayTR Bildirim URL:{" "}
                <code className="bg-muted px-2 py-1 rounded">
                  {origin}/functions/v1/paytr-callback
                </code>
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground pl-4 border-l-2 border-muted py-2">
              PayTR sağlayıcısı henüz tanımlı değil. Üstteki butondan
              oluşturabilirsiniz.
            </p>
          )}
        </section>

        {/* ==================== Shopier ==================== */}
        <section className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Shopier Entegrasyonu</h3>

            {!shopier && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  handleCreatePresetProvider("shopier", "Shopier", {
                    public_config: { mode: "test", commission: 0 },
                    secret_config: {},
                  })
                }
              >
                Shopier sağlayıcısı oluştur
              </Button>
            )}
          </div>

          {shopier ? (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center gap-2">
                <Switch
                  id="shopier_enabled"
                  checked={!!shopier.is_active}
                  onCheckedChange={(checked) =>
                    patchProvider(shopier, { is_active: checked })
                  }
                />
                <Label htmlFor="shopier_enabled" className="font-medium">
                  Shopier ile Ödeme
                </Label>
              </div>

              {shopier.is_active && (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shopier_client_id">Client ID</Label>
                      <Input
                        id="shopier_client_id"
                        value={shopierClientId}
                        onChange={(e) => setShopierClientId(e.target.value)}
                        onBlur={() => {
                          if (!shopier) return;
                          const sec = asObject<ShopierSecretConfig>(
                            shopier.secret_config
                          );
                          if (sec.client_id === shopierClientId) return;
                          patchProvider(shopier, {
                            secret_config: {
                              ...sec,
                              client_id: shopierClientId,
                            },
                          });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shopier_client_secret">
                        Client Secret
                      </Label>
                      <Input
                        id="shopier_client_secret"
                        type="password"
                        value={shopierClientSecret}
                        onChange={(e) =>
                          setShopierClientSecret(e.target.value)
                        }
                        onBlur={() => {
                          if (!shopier) return;
                          const sec = asObject<ShopierSecretConfig>(
                            shopier.secret_config
                          );
                          if (sec.client_secret === shopierClientSecret)
                            return;
                          patchProvider(shopier, {
                            secret_config: {
                              ...sec,
                              client_secret: shopierClientSecret,
                            },
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shopier_commission">
                      Shopier Komisyonu (%)
                    </Label>
                    <Input
                      id="shopier_commission"
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={shopierCommission}
                      onChange={(e) => setShopierCommission(e.target.value)}
                      onBlur={() => {
                        if (!shopier) return;
                        const pub = asObject<ShopierPublicConfig>(
                          shopier.public_config
                        );
                        const next =
                          parseFloat(shopierCommission || "0") || 0;
                        if (pub.commission === next) return;
                        patchProvider(shopier, {
                          public_config: {
                            ...pub,
                            commission: next,
                          },
                        });
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pl-4 border-l-2 border-muted py-2">
              Shopier sağlayıcısı henüz tanımlı değil.
            </p>
          )}
        </section>

        {/* ==================== Papara ==================== */}
        <section className="space-y-4 border-b pb-6">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold">Papara Entegrasyonu</h3>

            {!papara && (
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() =>
                  handleCreatePresetProvider("papara", "Papara", {
                    public_config: {},
                    secret_config: {},
                  })
                }
              >
                Papara sağlayıcısı oluştur
              </Button>
            )}
          </div>

          {papara ? (
            <div className="space-y-3 pl-4 border-l-2 border-muted">
              <div className="flex items-center gap-2">
                <Switch
                  id="papara_enabled"
                  checked={!!papara.is_active}
                  onCheckedChange={(checked) =>
                    patchProvider(papara, { is_active: checked })
                  }
                />
                <Label htmlFor="papara_enabled" className="font-medium">
                  Papara ile Ödeme
                </Label>
              </div>

              {papara.is_active && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="papara_api_key">Papara API Key</Label>
                  <Input
                    id="papara_api_key"
                    type="password"
                    value={paparaApiKey}
                    onChange={(e) => setPaparaApiKey(e.target.value)}
                    onBlur={() => {
                      if (!papara) return;
                      const sec = asObject<PaparaSecretConfig>(
                        papara.secret_config
                      );
                      if (sec.api_key === paparaApiKey) return;
                      patchProvider(papara, {
                        secret_config: {
                          ...sec,
                          api_key: paparaApiKey,
                        },
                      });
                    }}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground pl-4 border-l-2 border-muted py-2">
              Papara sağlayıcısı henüz tanımlı değil.
            </p>
          )}
        </section>

        {/* ==================== Banka Havalesi / EFT (SiteSettings) ==================== */}
        <section className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold">Banka Havalesi / EFT</h3>

          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="flex items-center gap-2">
              <Switch
                id="bank_transfer_enabled"
                checked={settings.bank_transfer_enabled}
                onCheckedChange={(checked) =>
                  setSettings((s) => ({
                    ...s,
                    bank_transfer_enabled: checked,
                  }))
                }
              />
              <Label htmlFor="bank_transfer_enabled" className="font-medium">
                Manuel Banka Havalesi ile Ödeme
              </Label>
            </div>

            {settings.bank_transfer_enabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="bank_account_info">
                  Hesap Bilgileri (IBAN, Banka, Hesap Sahibi)
                </Label>
                <Textarea
                  id="bank_account_info"
                  rows={4}
                  value={settings.bank_account_info}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      bank_account_info: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Müşteriye ödeme adımında gösterilecek metin.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* ==================== Diğer Ödeme Metod Ayarları (SiteSettings.payment_methods) ==================== */}
        <section className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold">Diğer Ödeme Metod Ayarları</h3>

          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {/* Cüzdan */}
            <div className="flex items-center gap-2">
              <Switch
                id="wallet_enabled"
                checked={settings.payment_methods?.wallet_enabled ?? false}
                onCheckedChange={(checked) =>
                  updatePaymentMethods({ wallet_enabled: checked })
                }
              />
              <Label htmlFor="wallet_enabled">Cüzdan ile Ödeme</Label>
            </div>

            {/* Havale detay */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <Switch
                  id="pm_havale_enabled"
                  checked={settings.payment_methods?.havale_enabled ?? false}
                  onCheckedChange={(checked) =>
                    updatePaymentMethods({ havale_enabled: checked })
                  }
                />
                <Label htmlFor="pm_havale_enabled">
                  Havale ile Ödeme (detay)
                </Label>
              </div>

              {settings.payment_methods?.havale_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="pm_havale_iban">IBAN</Label>
                    <Input
                      id="pm_havale_iban"
                      value={settings.payment_methods?.havale_iban ?? ""}
                      onChange={(e) =>
                        updatePaymentMethods({
                          havale_iban: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm_havale_account_holder">
                      Hesap Sahibi
                    </Label>
                    <Input
                      id="pm_havale_account_holder"
                      value={
                        settings.payment_methods?.havale_account_holder ?? ""
                      }
                      onChange={(e) =>
                        updatePaymentMethods({
                          havale_account_holder: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm_havale_bank_name">Banka Adı</Label>
                    <Input
                      id="pm_havale_bank_name"
                      value={settings.payment_methods?.havale_bank_name ?? ""}
                      onChange={(e) =>
                        updatePaymentMethods({
                          havale_bank_name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            {/* EFT detay */}
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-2">
                <Switch
                  id="pm_eft_enabled"
                  checked={settings.payment_methods?.eft_enabled ?? false}
                  onCheckedChange={(checked) =>
                    updatePaymentMethods({ eft_enabled: checked })
                  }
                />
                <Label htmlFor="pm_eft_enabled">EFT ile Ödeme (detay)</Label>
              </div>

              {settings.payment_methods?.eft_enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-6">
                  <div className="space-y-2">
                    <Label htmlFor="pm_eft_iban">IBAN</Label>
                    <Input
                      id="pm_eft_iban"
                      value={settings.payment_methods?.eft_iban ?? ""}
                      onChange={(e) =>
                        updatePaymentMethods({
                          eft_iban: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm_eft_account_holder">
                      Hesap Sahibi
                    </Label>
                    <Input
                      id="pm_eft_account_holder"
                      value={
                        settings.payment_methods?.eft_account_holder ?? ""
                      }
                      onChange={(e) =>
                        updatePaymentMethods({
                          eft_account_holder: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pm_eft_bank_name">Banka Adı</Label>
                    <Input
                      id="pm_eft_bank_name"
                      value={settings.payment_methods?.eft_bank_name ?? ""}
                      onChange={(e) =>
                        updatePaymentMethods({
                          eft_bank_name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ==================== Gelişmiş: Tüm Ödeme Sağlayıcıları (CRUD) ==================== */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">
            Tüm Ödeme Sağlayıcıları (Gelişmiş)
          </h3>

          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {providers.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Henüz tanımlı ödeme sağlayıcısı yok (seeddan gelmiyor olabilir).
              </p>
            )}

            {providers.length > 0 && (
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto_auto] gap-3 font-medium text-xs text-muted-foreground pb-1 border-b">
                  <span>Adı</span>
                  <span>Key</span>
                  <span>Aktif</span>
                  <span className="text-right">Sil</span>
                </div>

                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="grid grid-cols-[minmax(0,3fr)_minmax(0,2fr)_auto_auto] gap-3 items-center py-1 border-b last:border-b-0"
                  >
                    <span className="truncate">{p.display_name}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {p.key}
                    </span>
                    <div>
                      <Switch
                        checked={!!p.is_active}
                        onCheckedChange={(checked) =>
                          patchProvider(p, { is_active: checked })
                        }
                      />
                    </div>
                    <div className="flex justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs text-destructive"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${p.display_name}" sağlayıcısını silmek istediğine emin misin?`
                            )
                          ) {
                            deleteProvider(p.id);
                          }
                        }}
                      >
                        Sil
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Yeni provider ekle */}
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">
                Yeni Ödeme Sağlayıcısı Ekle
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-[2fr_2fr_auto] gap-2">
                <Input
                  placeholder="Örn: my_custom_provider"
                  value={newProviderKey}
                  onChange={(e) => setNewProviderKey(e.target.value)}
                />
                <Input
                  placeholder="Görünen Ad"
                  value={newProviderName}
                  onChange={(e) => setNewProviderName(e.target.value)}
                />
                <Button
                  size="sm"
                  disabled={
                    busy ||
                    !newProviderKey.trim() ||
                    !newProviderName.trim()
                  }
                  onClick={async () => {
                    await createProvider({
                      key: newProviderKey.trim(),
                      display_name: newProviderName.trim(),
                      is_active: true,
                      public_config: {},
                      secret_config: {},
                    });
                    setNewProviderKey("");
                    setNewProviderName("");
                  }}
                >
                  Ekle
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Bu alan genel amaçlıdır. Özel ekranları olmayan yeni
                sağlayıcıları (örneğin Stripe, iyzico vb.) buradan
                tanımlayabilirsiniz.
              </p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
