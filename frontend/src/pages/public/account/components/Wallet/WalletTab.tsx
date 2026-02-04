// =============================================================
// FILE: src/pages/account/components/Wallet/WalletTab.tsx
// FINAL — strict + exactOptionalPropertyTypes uyumlu
// - payment_sessions ile ödeme başlatma (PayTR/Shopier)
// - RTK Query error.data.message/error toast debug
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';

import { toast } from 'sonner';

import { useAuth } from '@/hooks/useAuth';
import {
  useGetMyProfileQuery,
  useListSiteSettingsQuery,
  useListPaymentProvidersQuery,
  useCreatePaymentSessionMutation,
  useCreateOrderMutation,
} from '@/integrations/hooks';

import type { WalletTransaction as WalletTxn, CreateOrderBody } from '@/integrations/types';

type PaymentMethodId = 'havale' | 'eft' | 'paytr' | 'shopier';

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
const WALLET_PRODUCT_ID = '00000000-0000-0000-0000-000000000000';

/* ---------- helpers ---------- */
const asNumber = (v: unknown, d = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : d;
};

const optStr = (v: unknown): string | undefined => {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s ? s : undefined;
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === 'object' && !Array.isArray(v);

const tryParseJsonObj = (v: unknown): Record<string, unknown> | null => {
  if (!v) return null;
  if (isRecord(v)) return v;
  if (typeof v === 'string') {
    try {
      const o = JSON.parse(v);
      return isRecord(o) ? o : null;
    } catch {
      return null;
    }
  }
  return null;
};

const toBoolLoose = (raw: unknown): boolean => {
  if (typeof raw === 'boolean') return raw;
  if (typeof raw === 'number') return raw === 1;
  if (typeof raw === 'string') {
    const s = raw.trim().toLowerCase();
    return s === '1' || s === 'true' || s === 'yes' || s === 'on' || s === 'enabled';
  }
  return false;
};

type BankTransferCfg = {
  type?: unknown;
  methods?: unknown;
  commission?: unknown;
  havale?: unknown;
  eft?: unknown;
};

const buildHavaleEftFromBankTransferProvider = (
  providerDisplayName: string | undefined,
  cfgRaw: unknown,
): PaymentMethod[] => {
  const cfg = (tryParseJsonObj(cfgRaw) ?? {}) as BankTransferCfg;

  const type = typeof cfg.type === 'string' ? cfg.type.trim() : '';
  if (type !== 'bank_transfer') return [];

  const commission = asNumber(cfg.commission, 0);

  const methodsArr = Array.isArray(cfg.methods) ? cfg.methods : [];
  const methodsSet = new Set(
    methodsArr.map((x) => (typeof x === 'string' ? x.trim().toLowerCase() : '')).filter(Boolean),
  );

  const readBankBlock = (block: unknown) => {
    const o = tryParseJsonObj(block) ?? {};
    return {
      iban: optStr(o.iban),
      account_holder: optStr(o.account_holder),
      bank_name: optStr(o.bank_name),
    };
  };

  const out: PaymentMethod[] = [];

  if (methodsSet.has('havale')) {
    const b = readBankBlock(cfg.havale);
    out.push({
      id: 'havale',
      name: providerDisplayName ? `${providerDisplayName} (Havale)` : 'Havale',
      enabled: true,
      commission,
      ...(b.iban ? { iban: b.iban } : {}),
      ...(b.account_holder ? { account_holder: b.account_holder } : {}),
      ...(b.bank_name ? { bank_name: b.bank_name } : {}),
    });
  }

  if (methodsSet.has('eft')) {
    const b = readBankBlock(cfg.eft);
    out.push({
      id: 'eft',
      name: providerDisplayName ? `${providerDisplayName} (EFT)` : 'EFT',
      enabled: true,
      commission,
      ...(b.iban ? { iban: b.iban } : {}),
      ...(b.account_holder ? { account_holder: b.account_holder } : {}),
      ...(b.bank_name ? { bank_name: b.bank_name } : {}),
    });
  }

  return out;
};

const uniqById = (methods: PaymentMethod[]): PaymentMethod[] => {
  const out: PaymentMethod[] = [];
  const seen = new Set<PaymentMethodId>();
  for (const m of methods) {
    if (seen.has(m.id)) continue;
    seen.add(m.id);
    out.push(m);
  }
  return out;
};

// tolerant profile pickers (exactOptionalPropertyTypes-safe)
const pickProfileName = (
  profileData: unknown,
): { first?: string; last?: string; phone?: string } => {
  if (!isRecord(profileData)) return {};

  const data = isRecord((profileData as Record<string, unknown>).data)
    ? ((profileData as Record<string, unknown>).data as Record<string, unknown>)
    : (profileData as Record<string, unknown>);

  if (!isRecord(data)) return {};

  const first =
    optStr(data.first_name) ??
    optStr(data.firstname) ??
    optStr(data.name) ??
    optStr((data as any).user?.first_name);

  const last =
    optStr(data.last_name) ??
    optStr(data.lastname) ??
    optStr(data.surname) ??
    optStr((data as any).user?.last_name);

  const phone =
    optStr(data.phone) ??
    optStr(data.phone_number) ??
    optStr((data as any).user?.phone);

  return {
    ...(first ? { first } : {}),
    ...(last ? { last } : {}),
    ...(phone ? { phone } : {}),
  };
};


// RTK Query error guard
const pickRtkErrorMessage = (e: unknown): string | undefined => {
  if (!isRecord(e)) return undefined;

  const data = e.data;
  if (isRecord(data)) {
    const msg = optStr(data.message) ?? optStr(data.error);
    if (msg) return msg;
  }

  const errMsg = optStr(e.error);
  if (errMsg) return errMsg;

  return undefined;
};

export function WalletTab({ txns, txLoading }: { txns: WalletTxn[]; txLoading?: boolean }) {
  const { user } = useAuth();
  const { data: profileData } = useGetMyProfileQuery();
  const navigate = useNavigate();

  const { data: siteSettings, isLoading: settingsLoading } = useListSiteSettingsQuery({
    keys: ['min_balance_limit', 'payment_methods', 'paytr_dev_user_ip'],
  });
  const { data: providers = [], isLoading: providersLoading } = useListPaymentProvidersQuery();

  const [createOrder, { isLoading: creatingOrder }] = useCreateOrderMutation();
  const [createPaymentSession] = useCreatePaymentSessionMutation();

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethodId | ''>('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositing, setDepositing] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);

  const minLimit = useMemo(() => {
    if (!siteSettings) return 10;
    const row = siteSettings.find((s) => s.key === 'min_balance_limit');
    return asNumber(row?.value, 10);
  }, [siteSettings]);

  const paytrDevIp = useMemo(() => {
    if (!siteSettings) return '';
    const row = siteSettings.find((s) => s.key === 'paytr_dev_user_ip');
    const v = (row as any)?.value;
    return typeof v === 'string' ? v.trim() : '';
  }, [siteSettings]);

  const paymentMethods = useMemo<PaymentMethod[]>(() => {
    if (!user) return [];

    const methods: PaymentMethod[] = [];
    const activeProviders = (providers ?? []).filter((p) => Boolean((p as any).is_active));

    // 1) NEW: bank_transfer provider -> Havale/EFT
    const bankProvider = activeProviders.find((p) => (p as any).key === 'bank_transfer');
    if (bankProvider) {
      const built = buildHavaleEftFromBankTransferProvider(
        (bankProvider as any).display_name,
        (bankProvider as any).public_config,
      );
      methods.push(...built);
    }

    // 2) Backward: site_settings.payment_methods JSON -> Havale/EFT
    const hasHavaleOrEft = methods.some((m) => m.id === 'havale' || m.id === 'eft');
    if (!hasHavaleOrEft && siteSettings) {
      const paymentMethodsRow = siteSettings.find((s) => s.key === 'payment_methods');
      const cfg = tryParseJsonObj(paymentMethodsRow?.value) ?? {};

      const getFromCfg = <T,>(k: string, d: T): T => (cfg[k] as T | undefined) ?? d;

      if (toBoolLoose(getFromCfg('havale_enabled', false))) {
        const iban = optStr(getFromCfg('havale_iban', undefined));
        const account_holder = optStr(getFromCfg('havale_account_holder', undefined));
        const bank_name = optStr(getFromCfg('havale_bank_name', undefined));

        methods.push({
          id: 'havale',
          name: 'Havale',
          enabled: true,
          commission: 0,
          ...(iban ? { iban } : {}),
          ...(account_holder ? { account_holder } : {}),
          ...(bank_name ? { bank_name } : {}),
        });
      }

      if (toBoolLoose(getFromCfg('eft_enabled', false))) {
        const iban = optStr(getFromCfg('eft_iban', undefined));
        const account_holder = optStr(getFromCfg('eft_account_holder', undefined));
        const bank_name = optStr(getFromCfg('eft_bank_name', undefined));

        methods.push({
          id: 'eft',
          name: 'EFT',
          enabled: true,
          commission: 0,
          ...(iban ? { iban } : {}),
          ...(account_holder ? { account_holder } : {}),
          ...(bank_name ? { bank_name } : {}),
        });
      }
    }

    // 3) paytr / shopier
    for (const p of activeProviders) {
      const key = (p as any).key as string | undefined;
      const cfgObj = tryParseJsonObj((p as any).public_config) ?? {};
      const commission = asNumber(cfgObj.commission, 0);

      if (key === 'paytr') {
        methods.push({
          id: 'paytr',
          name: (p as any).display_name || 'Kredi Kartı (PayTR)',
          enabled: true,
          commission,
        });
        continue;
      }

      if (key === 'shopier') {
        methods.push({
          id: 'shopier',
          name: (p as any).display_name || 'Kredi Kartı (Shopier)',
          enabled: true,
          commission,
        });
        continue;
      }

    }

    return uniqById(methods);
  }, [user, providers, siteSettings]);

  useEffect(() => {
    const first = paymentMethods[0];

    if (!first) {
      if (selectedPayment !== '') setSelectedPayment('');
      return;
    }

    if (!selectedPayment || !paymentMethods.some((m) => m.id === selectedPayment)) {
      setSelectedPayment(first.id);
    }
  }, [paymentMethods, selectedPayment]);

  const pagedTxns: WalletTxn[] = useMemo(() => {
    const start = (transactionsPage - 1) * itemsPerPage;
    return txns.slice(start, start + itemsPerPage);
  }, [txns, transactionsPage]);

  /* ---------- Deposit handlers ---------- */
  const handleDeposit = async () => {
    if (!user) {
      toast.error('Lütfen giriş yapın');
      navigate('/giris');
      return;
    }

    const amt = Number(depositAmount);
    if (!depositAmount || !Number.isFinite(amt) || amt <= 0) {
      toast.error('Geçerli bir miktar girin');
      return;
    }

    if (amt < minLimit) {
      toast.error(`Minimum yükleme tutarı ${minLimit.toLocaleString('tr-TR')} ₺'dir`);
      return;
    }

    if (!selectedPayment) {
      toast.error('Ödeme yöntemi seçiniz');
      return;
    }

    if (selectedPayment === 'paytr') await handlePayTRPayment();
    else if (selectedPayment === 'shopier') await handleShopierPayment();
    else if (selectedPayment === 'havale' || selectedPayment === 'eft') {
      toast.success('Ödeme bilgilerine yönlendiriliyorsunuz...');
      window.location.href = `/bakiye-odeme-bilgileri?amount=${encodeURIComponent(
        depositAmount,
      )}&method=${encodeURIComponent(selectedPayment)}`;
    }
  };

  /* ---------- PayTR Card ---------- */
  const handlePayTRPayment = async () => {
    if (!user || !profileData) return;

    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const paytrMethod = paymentMethods.find((m) => m.id === 'paytr');
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
        payment_method: 'paytr',
        payment_status: 'pending',
        notes: 'Cüzdan bakiye yükleme',
        items: [
          {
            product_id: WALLET_PRODUCT_ID,
            product_name: 'Cüzdan Bakiye Yükleme',
            quantity: 1,
            price: subtotalStr,
            total: subtotalStr,
            options: { type: 'wallet_topup' },
          },
        ],
        subtotal: subtotalStr,
        discount: '0.00',
        total: finalStr,
      };

      const order = await createOrder(body).unwrap();

      const prof = pickProfileName(profileData);
      const displayName = `${prof.first ?? 'Müşteri'} ${prof.last ?? ''}`.trim();

      const basket: Array<[string, string, number]> = [
        ['Cüzdan Bakiye Yükleme', subtotalStr, 1],
      ];
      if (commission > 0) {
        basket.push(['Ödeme Komisyonu', commission.toFixed(2), 1]);
      }

      const session = await createPaymentSession({
        provider_key: 'paytr',
        order_id: (order as any).id,
        amount: finalTotal,
        currency: 'TRY',
        customer: {
          id: user.id ?? undefined,
          email: user.email ?? '',
          name: displayName,
        },
        meta: {
          basket,
          user_phone: prof.phone,
          user_address: 'N/A',
          product_name: 'Cüzdan Bakiye Yükleme',
          ...(paytrDevIp ? { dev_user_ip: paytrDevIp } : {}),
        },
      }).unwrap();

      const sessionId = String((session as any)?.id ?? '').trim();
      if (!sessionId) throw new Error('payment_session_id_missing');

      sessionStorage.setItem(
        'payment_session',
        JSON.stringify({
          id: sessionId,
          provider_key: 'paytr',
          order_id: (order as any).id,
        }),
      );

      navigate(`/odeme-iframe?session_id=${encodeURIComponent(sessionId)}`);
    } catch (e) {
      console.error('PayTR payment error:', e);
      toast.error(e instanceof Error ? e.message : 'Ödeme başlatılamadı');
    } finally {
      setDepositing(false);
    }
  };

  /* ---------- Shopier (FIXED) ---------- */
  const handleShopierPayment = async () => {
    if (!user) return;

    const amount = Number(depositAmount);
    if (!Number.isFinite(amount) || amount <= 0) return;

    const shopierMethod = paymentMethods.find((m) => m.id === 'shopier');
    const commissionRate = shopierMethod?.commission ?? 0;
    const commission = (amount * commissionRate) / 100;
    const finalTotal = amount + commission;

    const subtotalStr = amount.toFixed(2);
    const finalStr = finalTotal.toFixed(2);

    setDepositing(true);
    try {
      const orderNumber = `WALLET${Date.now()}`;

      const orderBody: CreateOrderBody = {
        order_number: orderNumber,
        payment_method: 'shopier',
        payment_status: 'pending',
        notes: 'Cüzdan bakiye yükleme',
        items: [
          {
            product_id: WALLET_PRODUCT_ID,
            product_name: 'Cüzdan Bakiye Yükleme',
            quantity: 1,
            price: subtotalStr,
            total: subtotalStr,
            options: { type: 'wallet_topup' },
          },
        ],
        subtotal: subtotalStr,
        discount: '0.00',
        total: finalStr, // komisyon dahil toplam
      };

      const order = await createOrder(orderBody).unwrap();

      const prof = pickProfileName(profileData);
      const displayName = `${prof.first ?? 'Müşteri'} ${prof.last ?? ''}`.trim();

      const session = await createPaymentSession({
        provider_key: 'shopier',
        order_id: (order as any).id,
        amount: finalTotal,
        currency: 'TRY',
        customer: {
          id: user.id ?? undefined,
          email: user.email ?? '',
          name: displayName,
        },
        meta: {
          buyer_phone: prof.phone,
          product_name: 'Cüzdan Bakiye Yükleme',
          current_language: 0,
          is_in_frame: 0,
        },
      }).unwrap();

      const sessionId = String((session as any)?.id ?? '').trim();
      if (!sessionId) throw new Error('payment_session_id_missing');

      sessionStorage.setItem(
        'payment_session',
        JSON.stringify({
          id: sessionId,
          provider_key: 'shopier',
          order_id: (order as any).id,
        }),
      );

      navigate(`/odeme-iframe?session_id=${encodeURIComponent(sessionId)}`);
    } catch (e) {
      console.error('Shopier payment error:', e);

      const backendMsg = pickRtkErrorMessage(e);
      toast.error(backendMsg || (e instanceof Error ? e.message : 'Ödeme başlatılamadı'));
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
              Minimum tutar: {minLimit.toLocaleString('tr-TR')} ₺
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
                  className="space-y-2"
                >
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={method.id} id={method.id} />
                      <Label htmlFor={method.id} className="flex-1 cursor-pointer select-none">
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

                {depositAmount && Number(depositAmount) > 0 && (
                  <div className="p-4 bg-muted rounded-md space-y-2">
                    <div className="flex justify-between">
                      <span>Yüklenecek Miktar:</span>
                      <span className="font-semibold">₺{Number(depositAmount).toFixed(2)}</span>
                    </div>

                    {(() => {
                      const selected = paymentMethods.find((m) => m.id === selectedPayment);
                      const commissionRate = selected?.commission ?? 0;
                      const commissionAmount = (Number(depositAmount) * commissionRate) / 100;

                      if (commissionRate > 0) {
                        return (
                          <>
                            <div className="flex justify-between text-sm text-muted-foreground">
                              <span>Komisyon (%{commissionRate}):</span>
                              <span>₺{commissionAmount.toFixed(2)}</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                              <span>Toplam Ödenecek:</span>
                              <span>₺{(Number(depositAmount) + commissionAmount).toFixed(2)}</span>
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
              !Number.isFinite(Number(depositAmount)) ||
              Number(depositAmount) <= 0 ||
              !selectedPayment
            }
          >
            {depositing || creatingOrder ? 'İşleniyor...' : 'Bakiye Yükle'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Son İşlemler</CardTitle>
        </CardHeader>

        <CardContent>
          {txns.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">İşlem geçmişi bulunmamaktadır.</p>
          ) : (
            <>
              <div className="space-y-2">
                {pagedTxns.map((txn) => (
                  <div key={txn.id} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-medium">{txn.description ?? 'Cüzdan İşlemi'}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(txn.created_at).toLocaleString('tr-TR')}
                      </p>
                    </div>

                    <p className={`font-bold ${txn.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.amount > 0 ? '+' : ''}₺{txn.amount.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              {Math.ceil(txns.length / itemsPerPage) > 1 && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                        className={transactionsPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {Array.from({ length: Math.ceil(txns.length / itemsPerPage) }, (_, i) => i + 1).map((page) => (
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
                          setTransactionsPage((p) => Math.min(Math.ceil(txns.length / itemsPerPage), p + 1))
                        }
                        className={
                          transactionsPage === Math.ceil(txns.length / itemsPerPage)
                            ? 'pointer-events-none opacity-50'
                            : 'cursor-pointer'
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}

              {txLoading && <div className="text-xs text-muted-foreground mt-2">İşlemler yenileniyor…</div>}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
