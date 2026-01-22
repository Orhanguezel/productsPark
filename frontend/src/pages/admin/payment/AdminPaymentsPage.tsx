// =============================================================
// FILE: src/pages/admin/payments/AdminPaymentsPage.tsx
// FINAL — Admin Payments Module (eslint-clean)
// - fixes: no-extra-boolean-cast, no-unused-expressions
// - helpers centralized in ./utils.ts
// - strict + exactOptionalPropertyTypes friendly
// =============================================================

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Save, Copy } from 'lucide-react';
import { toast } from 'sonner';

import {
  useListSiteSettingsAdminQuery,
  useBulkUpsertSiteSettingsAdminMutation,
  useListPaymentProvidersAdminQuery,
  useCreatePaymentProviderAdminMutation,
  useUpdatePaymentProviderAdminMutation,
  useGetPaymentProviderByKeyQuery,
  useGetPaymentProviderAdminByIdQuery,
} from '@/integrations/hooks';

import type {
  PaymentProviderAdmin,
  PaymentProviderKey,
  UpsertPaymentProviderAdminBody,
  ProviderForm,
  PaymentMethods,
} from '@/integrations/types';

import { PAYTR_KEY, SHOPIER_KEY, PAPARA_KEY, PROVIDER_DISPLAY_NAMES } from '@/integrations/types';

import { asBoolLike, toBool, toNum } from '@/integrations/types/common';

import {
  buildCallbackUrl,
  buildPaytrBody,
  buildPaparaBody,
  buildShopierBody,
  buildSitePaymentSettingsUpserts,
  findProvider as findProviderUtil,
  providerToForm,
  readPaymentMethods,
  toSiteSettingsMap,
  writeClipboard,
} from './utils';

export default function AdminPaymentsPage() {
  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);

  // ====== site settings (bank transfer + payment_methods) ======
  const {
    data: siteSettingsRes,
    isLoading: loadingSettings,
    isFetching: fetchingSettings,
  } = useListSiteSettingsAdminQuery();

  const [bulkUpsert, { isLoading: savingSiteSettings }] = useBulkUpsertSiteSettingsAdminMutation();

  const [initialized, setInitialized] = useState(false);

  const [bankTransferEnabled, setBankTransferEnabled] = useState(false);
  const [bankAccountInfo, setBankAccountInfo] = useState('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethods>({ wallet_enabled: true });

  useEffect(() => {
    if (!siteSettingsRes || initialized) return;

    const map = toSiteSettingsMap(siteSettingsRes);

    const bt = map.get('bank_transfer_enabled')?.value;
    const bi = map.get('bank_account_info')?.value;
    const pm = map.get('payment_methods')?.value;

    setBankTransferEnabled(toBool(asBoolLike(bt), false));
    setBankAccountInfo(typeof bi === 'string' ? bi : String(bi ?? ''));
    setPaymentMethods(readPaymentMethods(pm));

    setInitialized(true);
  }, [siteSettingsRes, initialized]);

  const saveSitePaymentSettings = async () => {
    try {
      const items = buildSitePaymentSettingsUpserts({
        bankTransferEnabled,
        bankAccountInfo,
        paymentMethods,
      });

      await bulkUpsert({ items }).unwrap();
      toast.success('Ödeme ayarları kaydedildi');
    } catch (e: unknown) {
      console.error(e);
      toast.error('Ödeme ayarları kaydedilemedi');
    }
  };

  // ====== providers list + create/update ======
  const {
    data: providers = [],
    isLoading: loadingProviders,
    isFetching: fetchingProviders,
  } = useListPaymentProvidersAdminQuery(undefined);

  const [createProvider, { isLoading: creatingProvider }] = useCreatePaymentProviderAdminMutation();
  const [updateProvider, { isLoading: updatingProvider }] = useUpdatePaymentProviderAdminMutation();

  const busyProviders =
    loadingProviders || fetchingProviders || creatingProvider || updatingProvider;

  const findProvider = (key: PaymentProviderKey): PaymentProviderAdmin | null =>
    findProviderUtil(providers as PaymentProviderAdmin[], key);

  // PayTR: get by key -> id -> admin by id
  const { data: paytrPublic } = useGetPaymentProviderByKeyQuery(PAYTR_KEY);
  const paytrId = paytrPublic?.id ?? null;
  const { data: paytrAdmin } = useGetPaymentProviderAdminByIdQuery(paytrId as string, {
    skip: !paytrId,
  });

  // callback urls (default)
  const paytrCallbackUrl = useMemo(
    () => buildCallbackUrl(origin, '/functions/paytr-callback'),
    [origin],
  );
  const shopierCallbackUrl = useMemo(
    () => buildCallbackUrl(origin, '/functions/shopier-callback'),
    [origin],
  );
  const paparaCallbackUrl = useMemo(
    () => buildCallbackUrl(origin, '/functions/papara-callback'),
    [origin],
  );

  // Provider forms
  const [paytrForm, setPaytrForm] = useState<ProviderForm>({ enabled: false });
  const [shopierForm, setShopierForm] = useState<ProviderForm>({ enabled: false });
  const [paparaForm, setPaparaForm] = useState<ProviderForm>({ enabled: false });

  useEffect(() => {
    setPaytrForm(providerToForm(findProvider(PAYTR_KEY)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  useEffect(() => {
    setShopierForm(providerToForm(findProvider(SHOPIER_KEY)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  useEffect(() => {
    setPaparaForm(providerToForm(findProvider(PAPARA_KEY)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers]);

  const ensureProvider = async (key: PaymentProviderKey) => {
    const existing = findProvider(key);
    if (existing?.id) return existing;

    const displayName =
      (PROVIDER_DISPLAY_NAMES as Record<string, string>)[String(key)] ?? String(key);

    const created = await createProvider({
      key,
      display_name: displayName,
      is_active: 1,
      public_config: null,
      secret_config: null,
    }).unwrap();

    return created as PaymentProviderAdmin;
  };

  const saveProvider = async (key: PaymentProviderKey, body: UpsertPaymentProviderAdminBody) => {
    const existing = findProvider(key);
    if (!existing?.id) {
      toast.error('Sağlayıcı bulunamadı (önce oluşturun)');
      return;
    }
    await updateProvider({ id: existing.id, body }).unwrap();
    toast.success('Sağlayıcı kaydedildi');
  };

  const initialLoading =
    !initialized && (loadingSettings || fetchingSettings || loadingProviders || fetchingProviders);

  if (initialLoading) {
    return (
      <AdminLayout title="Ödeme Ayarları">
        <div className="flex items-center justify-center py-8">Yükleniyor...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Ödeme Ayarları">
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="paytr">PayTR</TabsTrigger>
          <TabsTrigger value="shopier">Shopier</TabsTrigger>
          <TabsTrigger value="papara">Papara</TabsTrigger>
          <TabsTrigger value="providers">Sağlayıcılar</TabsTrigger>
        </TabsList>

        {/* ===================== GENERAL ===================== */}
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genel Ödeme Ayarları</CardTitle>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Wallet */}
              <section className="space-y-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="wallet_enabled"
                    checked={paymentMethods.wallet_enabled ?? false}
                    onCheckedChange={(checked) =>
                      setPaymentMethods((prev) => ({ ...prev, wallet_enabled: checked }))
                    }
                  />
                  <Label htmlFor="wallet_enabled" className="font-medium">
                    Cüzdan ile Ödeme
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground">
                  Aktifse kullanıcılar checkout aşamasında cüzdan bakiyesini kullanabilir.
                </p>
              </section>

              {/* Bank Transfer */}
              <section className="space-y-3 border-t pt-6">
                <div className="flex items-center gap-3">
                  <Switch
                    id="bank_transfer_enabled"
                    checked={bankTransferEnabled}
                    onCheckedChange={(checked) => setBankTransferEnabled(checked)}
                  />
                  <Label htmlFor="bank_transfer_enabled" className="font-medium">
                    Havale / EFT ile Ödeme
                  </Label>
                </div>

                {bankTransferEnabled ? (
                  <div className="space-y-2">
                    <Label htmlFor="bank_account_info">Banka Hesap Bilgileri</Label>
                    <Textarea
                      id="bank_account_info"
                      rows={5}
                      value={bankAccountInfo}
                      onChange={(e) => setBankAccountInfo(e.target.value)}
                      placeholder="IBAN, Banka Adı, Hesap Sahibi, Şube vb."
                    />
                    <p className="text-xs text-muted-foreground">
                      Bu metin ödeme bilgilendirme sayfasında gösterilir.
                    </p>
                  </div>
                ) : null}
              </section>

              <div className="flex justify-end">
                <Button
                  onClick={saveSitePaymentSettings}
                  disabled={savingSiteSettings}
                  className="gap-2"
                >
                  <Save className="w-4 h-4" />
                  {savingSiteSettings ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== PAYTR ===================== */}
        <TabsContent value="paytr" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>PayTR</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label>PayTR Bildirim URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={paytrCallbackUrl} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      const ok = await writeClipboard(paytrCallbackUrl);
                      if (ok) toast.success('Kopyalandı');
                      else toast.error('Kopyalanamadı');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Kopyala
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  PayTR panelinde “Bildirim URL” alanına bu adresi girin.
                </p>
              </div>

              {findProvider(PAYTR_KEY) === null ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm">
                    PayTR sağlayıcısı tanımlı değil. Oluşturup konfigüre edebilirsiniz.
                  </p>
                  <Button
                    disabled={busyProviders}
                    onClick={async () => {
                      try {
                        await ensureProvider(PAYTR_KEY);
                        toast.success('PayTR sağlayıcısı oluşturuldu');
                      } catch (e) {
                        console.error(e);
                        toast.error('PayTR oluşturulamadı');
                      }
                    }}
                  >
                    PayTR Sağlayıcısı Oluştur
                  </Button>
                </div>
              ) : null}

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch
                    id="paytr_enabled"
                    checked={paytrForm.enabled}
                    onCheckedChange={(checked) => setPaytrForm((p) => ({ ...p, enabled: checked }))}
                  />
                  <Label htmlFor="paytr_enabled" className="font-medium">
                    PayTR Aktif
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="paytr_test_mode"
                    checked={paytrForm.test_mode !== false}
                    onCheckedChange={(checked) =>
                      setPaytrForm((p) => ({ ...p, test_mode: checked }))
                    }
                  />
                  <Label htmlFor="paytr_test_mode" className="font-medium">
                    Test Mode
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Kredi Kartı Komisyon (%)</Label>
                  <Input
                    value={String(paytrForm.card_commission ?? 0)}
                    onChange={(e) =>
                      setPaytrForm((p) => ({ ...p, card_commission: toNum(e.target.value, 0) }))
                    }
                  />
                </div>

                <div className="flex items-center gap-3">
                  <Switch
                    id="paytr_havale_enabled"
                    checked={paytrForm.havale_enabled ?? false}
                    onCheckedChange={(checked) =>
                      setPaytrForm((p) => ({ ...p, havale_enabled: checked }))
                    }
                  />
                  <Label htmlFor="paytr_havale_enabled" className="font-medium">
                    PayTR Havale Aktif
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>PayTR Havale Komisyon (%)</Label>
                  <Input
                    value={String(paytrForm.havale_commission ?? 0)}
                    onChange={(e) =>
                      setPaytrForm((p) => ({
                        ...p,
                        havale_commission: toNum(e.target.value, 0),
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Merchant ID</Label>
                  <Input
                    value={paytrForm.merchant_id ?? ''}
                    onChange={(e) => setPaytrForm((p) => ({ ...p, merchant_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Merchant Key</Label>
                  <Input
                    value={paytrForm.merchant_key ?? ''}
                    onChange={(e) => setPaytrForm((p) => ({ ...p, merchant_key: e.target.value }))}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Merchant Salt</Label>
                  <Input
                    value={paytrForm.merchant_salt ?? ''}
                    onChange={(e) => setPaytrForm((p) => ({ ...p, merchant_salt: e.target.value }))}
                  />
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  className="gap-2"
                  disabled={busyProviders || findProvider(PAYTR_KEY) === null}
                  onClick={async () => {
                    try {
                      await saveProvider(PAYTR_KEY, buildPaytrBody(paytrForm));
                    } catch (e) {
                      console.error(e);
                      toast.error('PayTR kaydedilemedi');
                    }
                  }}
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </Button>
              </div>

              {paytrAdmin ? (
                <p className="text-xs text-muted-foreground">
                  PayTR Provider ID:{' '}
                  <code className="bg-muted px-2 py-1 rounded">{String(paytrAdmin.id)}</code>
                </p>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== SHOPIER ===================== */}
        <TabsContent value="shopier" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Shopier</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label>Shopier Bildirim URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={shopierCallbackUrl} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      const ok = await writeClipboard(shopierCallbackUrl);
                      if (ok) toast.success('Kopyalandı');
                      else toast.error('Kopyalanamadı');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Kopyala
                  </Button>
                </div>
              </div>

              {findProvider(SHOPIER_KEY) === null ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm">
                    Shopier sağlayıcısı tanımlı değil. Oluşturup konfigüre edebilirsiniz.
                  </p>
                  <Button
                    disabled={busyProviders}
                    onClick={async () => {
                      try {
                        await ensureProvider(SHOPIER_KEY);
                        toast.success('Shopier sağlayıcısı oluşturuldu');
                      } catch (e) {
                        console.error(e);
                        toast.error('Shopier oluşturulamadı');
                      }
                    }}
                  >
                    Shopier Sağlayıcısı Oluştur
                  </Button>
                </div>
              ) : null}

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch
                    id="shopier_enabled"
                    checked={shopierForm.enabled}
                    onCheckedChange={(checked) =>
                      setShopierForm((p) => ({ ...p, enabled: checked }))
                    }
                  />
                  <Label htmlFor="shopier_enabled" className="font-medium">
                    Shopier Aktif
                  </Label>
                </div>

                <div className="space-y-2">
                  <Label>Client ID</Label>
                  <Input
                    value={shopierForm.client_id ?? ''}
                    onChange={(e) => setShopierForm((p) => ({ ...p, client_id: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Client Secret</Label>
                  <Input
                    value={shopierForm.client_secret ?? ''}
                    onChange={(e) =>
                      setShopierForm((p) => ({ ...p, client_secret: e.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Komisyon (%)</Label>
                  <Input
                    value={String(shopierForm.commission ?? 0)}
                    onChange={(e) =>
                      setShopierForm((p) => ({ ...p, commission: toNum(e.target.value, 0) }))
                    }
                  />
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  className="gap-2"
                  disabled={busyProviders || findProvider(SHOPIER_KEY) === null}
                  onClick={async () => {
                    try {
                      await saveProvider(SHOPIER_KEY, buildShopierBody(shopierForm));
                    } catch (e) {
                      console.error(e);
                      toast.error('Shopier kaydedilemedi');
                    }
                  }}
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== PAPARA ===================== */}
        <TabsContent value="papara" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Papara</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="flex flex-col gap-2">
                <Label>Papara Bildirim URL</Label>
                <div className="flex items-center gap-2">
                  <Input value={paparaCallbackUrl} readOnly />
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    onClick={async () => {
                      const ok = await writeClipboard(paparaCallbackUrl);
                      if (ok) toast.success('Kopyalandı');
                      else toast.error('Kopyalanamadı');
                    }}
                  >
                    <Copy className="w-4 h-4" />
                    Kopyala
                  </Button>
                </div>
              </div>

              {findProvider(PAPARA_KEY) === null ? (
                <div className="border rounded-lg p-4 space-y-3">
                  <p className="text-sm">
                    Papara sağlayıcısı tanımlı değil. Oluşturup konfigüre edebilirsiniz.
                  </p>
                  <Button
                    disabled={busyProviders}
                    onClick={async () => {
                      try {
                        await ensureProvider(PAPARA_KEY);
                        toast.success('Papara sağlayıcısı oluşturuldu');
                      } catch (e) {
                        console.error(e);
                        toast.error('Papara oluşturulamadı');
                      }
                    }}
                  >
                    Papara Sağlayıcısı Oluştur
                  </Button>
                </div>
              ) : null}

              <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 md:col-span-2">
                  <Switch
                    id="papara_enabled"
                    checked={paparaForm.enabled}
                    onCheckedChange={(checked) =>
                      setPaparaForm((p) => ({ ...p, enabled: checked }))
                    }
                  />
                  <Label htmlFor="papara_enabled" className="font-medium">
                    Papara Aktif
                  </Label>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>API Key</Label>
                  <Input
                    value={paparaForm.api_key ?? ''}
                    onChange={(e) => setPaparaForm((p) => ({ ...p, api_key: e.target.value }))}
                  />
                </div>
              </section>

              <div className="flex justify-end">
                <Button
                  className="gap-2"
                  disabled={busyProviders || findProvider(PAPARA_KEY) === null}
                  onClick={async () => {
                    try {
                      await saveProvider(PAPARA_KEY, buildPaparaBody(paparaForm));
                    } catch (e) {
                      console.error(e);
                      toast.error('Papara kaydedilemedi');
                    }
                  }}
                >
                  <Save className="w-4 h-4" />
                  Kaydet
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===================== PROVIDERS (overview) ===================== */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Sağlayıcılar (Genel Liste)</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              {busyProviders ? (
                <p className="text-xs text-muted-foreground">Güncelleniyor…</p>
              ) : null}

              {(providers as PaymentProviderAdmin[]).length === 0 ? (
                <p className="text-sm text-muted-foreground">Henüz tanımlı sağlayıcı yok.</p>
              ) : (
                <div className="space-y-2 text-sm">
                  {(providers as PaymentProviderAdmin[]).map((p) => (
                    <div
                      key={String(p.id)}
                      className="flex items-center justify-between gap-3 py-2 border-b last:border-b-0"
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{p.display_name}</div>
                        <div className="truncate text-xs text-muted-foreground">{p.key}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={async (checked) => {
                            try {
                              await updateProvider({
                                id: p.id,
                                body: { is_active: checked ? 1 : 0 },
                              }).unwrap();
                              toast.success('Güncellendi');
                            } catch (e) {
                              console.error(e);
                              toast.error('Güncellenemedi');
                            }
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Not: Özel ekranları olan sağlayıcılar (PayTR/Shopier/Papara) kendi sekmelerinden
                yönetilmelidir.
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}
