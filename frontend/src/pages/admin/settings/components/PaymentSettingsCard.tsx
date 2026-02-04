'use client';

// =============================================================
// FINAL — Payment Settings Card (SettingsPage state compatible)
// - Accepts ANY parent settings model (T)
// - NO type constraint that conflicts with payment_methods: unknown
// - Reads/writes via safe helpers on Record<string, unknown>
// - exactOptionalPropertyTypes friendly
// =============================================================

import { useMemo, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

import {
  useListPaymentProvidersAdminQuery,
  useCreatePaymentProviderAdminMutation,
  useUpdatePaymentProviderAdminMutation,
  useDeletePaymentProviderAdminMutation,
} from '@/integrations/hooks';

import type {
  PaymentProviderAdmin,
  PaymentProviderKey,
  UpsertPaymentProviderAdminBody,
} from '@/integrations/types';

// ----------------------- local helper types -----------------------

type PaymentMethods = {
  wallet_enabled?: boolean;

  havale_enabled?: boolean;
  havale_iban?: string;
  havale_account_holder?: string;
  havale_bank_name?: string;

  eft_enabled?: boolean;
  eft_iban?: string;
  eft_account_holder?: string;
  eft_bank_name?: string;
};

type Props<T> = {
  settings: T;
  setSettings: Dispatch<SetStateAction<T>>;
  origin: string;
  savingProvider?: boolean;
};

// ----------------------- helpers -----------------------

const boolish = (v: unknown): boolean => v === true || v === 'true' || v === 1 || v === '1';

const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const readPaymentMethods = (v: unknown): PaymentMethods | null => {
  if (v == null) return null;
  if (!isObject(v)) return null;

  const o = v as Record<string, unknown>;
  const out: PaymentMethods = {};

  if (typeof o.wallet_enabled === 'boolean') out.wallet_enabled = o.wallet_enabled;

  if (typeof o.havale_enabled === 'boolean') out.havale_enabled = o.havale_enabled;
  if (typeof o.havale_iban === 'string') out.havale_iban = o.havale_iban;
  if (typeof o.havale_account_holder === 'string')
    out.havale_account_holder = o.havale_account_holder;
  if (typeof o.havale_bank_name === 'string') out.havale_bank_name = o.havale_bank_name;

  if (typeof o.eft_enabled === 'boolean') out.eft_enabled = o.eft_enabled;
  if (typeof o.eft_iban === 'string') out.eft_iban = o.eft_iban;
  if (typeof o.eft_account_holder === 'string') out.eft_account_holder = o.eft_account_holder;
  if (typeof o.eft_bank_name === 'string') out.eft_bank_name = o.eft_bank_name;

  return out;
};

export default function PaymentSettingsCard<T>({
  settings,
  setSettings,
  origin,
  savingProvider,
}: Props<T>) {
  const dyn = settings as unknown as Record<string, unknown>;

  // ==================== Payment Providers (RTK) ====================
  const {
    data: providers = [],
    isLoading,
    isFetching,
  } = useListPaymentProvidersAdminQuery(undefined);
  const [createProvider, { isLoading: creatingProvider }] = useCreatePaymentProviderAdminMutation();
  const [updateProvider, { isLoading: updatingProvider }] = useUpdatePaymentProviderAdminMutation();
  const [deleteProvider, { isLoading: deletingProvider }] = useDeletePaymentProviderAdminMutation();

  const busy =
    isLoading ||
    isFetching ||
    creatingProvider ||
    updatingProvider ||
    deletingProvider ||
    !!savingProvider;

  const findProvider = (key: PaymentProviderKey): PaymentProviderAdmin | undefined =>
    providers.find((p) => p.key === key);

  const patchProvider = async (
    provider: PaymentProviderAdmin,
    patch: UpsertPaymentProviderAdminBody,
  ) => {
    if (!provider?.id) return;
    await updateProvider({ id: provider.id, body: patch }).unwrap();
  };

  // ==================== Settings (flat) ====================

  const bankTransferEnabled = boolish(dyn.bank_transfer_enabled);
  const bankAccountInfo =
    typeof dyn.bank_account_info === 'string'
      ? dyn.bank_account_info
      : String(dyn.bank_account_info ?? '');

  // payment_methods may be unknown (parent model)
  const paymentMethods = readPaymentMethods(dyn.payment_methods) ?? {};

  const updatePaymentMethods = (patch: Partial<PaymentMethods>) => {
    setSettings((prev) => {
      const out = { ...(prev as unknown as Record<string, unknown>) };
      const current = readPaymentMethods(out.payment_methods) ?? {};
      out.payment_methods = { ...current, ...patch };
      return out as unknown as T;
    });
  };

  // ==================== CRUD local UI state (advanced) ====================
  const [newProviderKey, setNewProviderKey] = useState('');
  const [newProviderName, setNewProviderName] = useState('');

  // provider shortcuts
  const paytr = findProvider('paytr');

  const paytrCallbackUrl = useMemo(() => `${origin}/paytr/notify`, [origin]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Yöntemleri</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {busy && (
          <p className="text-xs text-muted-foreground">Ödeme sağlayıcıları güncelleniyor…</p>
        )}

        {/* ==================== Cüzdan ==================== */}
        <section className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold">Cüzdan (Site İçi Bakiye)</h3>

          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="flex items-center gap-2">
              <Switch
                id="wallet_enabled"
                checked={paymentMethods.wallet_enabled ?? false}
                onCheckedChange={(checked) => updatePaymentMethods({ wallet_enabled: checked })}
              />
              <Label htmlFor="wallet_enabled" className="font-medium">
                Cüzdan ile Ödeme
              </Label>
            </div>

            <p className="text-xs text-muted-foreground">
              Aktif olduğunda müşteriler cüzdan bakiyesini ödeme adımında kullanabilir.
            </p>
          </div>
        </section>

        {/* ==================== Banka Transferi (flat) ==================== */}
        <section className="space-y-4 border-b pb-6">
          <h3 className="text-lg font-semibold">Banka Havalesi / EFT</h3>

          <div className="space-y-3 pl-4 border-l-2 border-muted">
            <div className="flex items-center gap-2">
              <Switch
                id="bank_transfer_enabled"
                checked={bankTransferEnabled}
                onCheckedChange={(checked) =>
                  setSettings(
                    (s) =>
                      ({
                        ...(s as unknown as Record<string, unknown>),
                        bank_transfer_enabled: checked,
                      } as unknown as T),
                  )
                }
              />
              <Label htmlFor="bank_transfer_enabled" className="font-medium">
                Manuel Banka Havalesi ile Ödeme
              </Label>
            </div>

            {bankTransferEnabled && (
              <div className="space-y-2 pt-2">
                <Label htmlFor="bank_account_info">
                  Hesap Bilgileri (IBAN, Banka, Hesap Sahibi)
                </Label>
                <Textarea
                  id="bank_account_info"
                  rows={4}
                  value={bankAccountInfo}
                  onChange={(e) =>
                    setSettings(
                      (s) =>
                        ({
                          ...(s as unknown as Record<string, unknown>),
                          bank_account_info: e.target.value,
                        } as unknown as T),
                    )
                  }
                />
              </div>
            )}
          </div>
        </section>

        {/* ==================== PayTR callback info ==================== */}
        {paytr && (
          <p className="text-sm text-muted-foreground">
            PayTR Bildirim URL:{' '}
            <code className="bg-muted px-2 py-1 rounded">{paytrCallbackUrl}</code>
          </p>
        )}

        {/* ==================== Advanced provider list ==================== */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Tüm Ödeme Sağlayıcıları (Gelişmiş)</h3>

          <div className="space-y-3 pl-4 border-l-2 border-muted">
            {providers.length === 0 && (
              <p className="text-sm text-muted-foreground">Henüz tanımlı ödeme sağlayıcısı yok.</p>
            )}

            {providers.length > 0 && (
              <div className="space-y-2 text-sm">
                {providers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 py-1 border-b last:border-b-0"
                  >
                    <div className="min-w-0">
                      <div className="truncate">{p.display_name}</div>
                      <div className="truncate text-xs text-muted-foreground">{p.key}</div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!p.is_active}
                        onCheckedChange={(checked) => patchProvider(p, { is_active: checked })}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-destructive"
                        disabled={busy}
                        onClick={async () => {
                          if (
                            window.confirm(
                              `"${p.display_name}" sağlayıcısını silmek istediğine emin misin?`,
                            )
                          ) {
                            await deleteProvider(p.id).unwrap();
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

            {/* New provider create */}
            <div className="mt-4 space-y-2">
              <Label className="text-sm font-medium">Yeni Ödeme Sağlayıcısı Ekle</Label>

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
                  disabled={busy || !newProviderKey.trim() || !newProviderName.trim()}
                  onClick={async () => {
                    await createProvider({
                      key: newProviderKey.trim() as PaymentProviderKey,
                      display_name: newProviderName.trim(),
                      is_active: true,
                      public_config: {},
                      secret_config: {},
                    }).unwrap();

                    setNewProviderKey('');
                    setNewProviderName('');
                  }}
                >
                  Ekle
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Bu alan genel amaçlıdır. Özel ekranları olmayan sağlayıcıları buradan
                tanımlayabilirsiniz.
              </p>
            </div>
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
