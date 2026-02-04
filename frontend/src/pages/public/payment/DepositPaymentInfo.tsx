// =============================================================
// FILE: src/pages/public/payment/DepositPaymentInfo.tsx
// FINAL — Wallet deposit via bank_transfer (provider_key)
// - payment_method: 'bank_transfer' (NOT 'havale')
// - bank_account_info: JsonLike -> safe display
// - auth guard: no redirect while authLoading
// - kind: 'havale'|'eft' is a UI detail (optional), NOT provider_key
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Copy, CheckCircle } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import {
  useGetSiteSettingByKeyQuery,
  useCreateWalletDepositRequestMutation,
  useGetMyProfileQuery,
  useSendTelegramNotificationMutation,
} from '@/integrations/hooks';

import { isPlainObject, toStr } from '@/integrations/types/common';

/* ---------------- helpers (no-any) ---------------- */
const asNumber = (v: unknown, d = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};

const asString = (v: unknown, d = ''): string => (v == null ? d : String(v));

const asBoolLoose = (v: unknown, d = false): boolean => {
  if (typeof v === 'boolean') return v;
  const s = String(v ?? '')
    .trim()
    .toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on', 'enabled'].includes(s)) return true;
  if (['0', 'false', 'no', 'n', 'off', 'disabled'].includes(s)) return false;
  return d;
};

type BankTransferKind = 'havale' | 'eft';
const parseKind = (v: unknown): BankTransferKind => {
  const s = typeof v === 'string' ? v.trim().toLowerCase() : '';
  return s === 'eft' ? 'eft' : 'havale';
};

function jsonLikeToText(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    if (Array.isArray(v) || isPlainObject(v)) return JSON.stringify(v, null, 2);
  } catch {
    // ignore
  }
  return toStr(v);
}

export default function DepositPaymentInfo() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const amountParam = searchParams.get('amount') ?? '';
  const amount = useMemo<number>(() => {
    const n = Number(amountParam.replace(',', '.'));
    return Number.isFinite(n) ? n : NaN;
  }, [amountParam]);

  const kind = useMemo<BankTransferKind>(() => {
    // optional: /deposit-payment-info?amount=100&kind=eft
    const qpKind = searchParams.get('kind');
    // also allow sessionStorage override if you want unified behavior
    const ssKind = sessionStorage.getItem('bankTransferKind');
    return parseKind(qpKind ?? ssKind ?? 'havale');
  }, [searchParams]);

  const [bankInfo, setBankInfo] = useState<string | null>(null);
  const [minLimit, setMinLimit] = useState<number>(10);
  const [tgEnabled, setTgEnabled] = useState<boolean>(false);

  const [createWalletDepositRequest, { isLoading: creatingDeposit }] =
    useCreateWalletDepositRequestMutation();

  const [sendTelegramNotification] = useSendTelegramNotificationMutation();

  const { data: minSetting, isLoading: minLoading } =
    useGetSiteSettingByKeyQuery('min_balance_limit');

  const { data: bankSetting, isLoading: bankLoading } =
    useGetSiteSettingByKeyQuery('bank_account_info');

  const { data: tgSetting, isLoading: tgLoading } = useGetSiteSettingByKeyQuery(
    'new_deposit_request_telegram',
  );

  const { data: meProfile } = useGetMyProfileQuery(undefined, { skip: !user });

  const settingsReady = !minLoading && !bankLoading && !tgLoading;
  const loading = authLoading || !settingsReady;

  // auth guard (do not redirect while authLoading)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      toast.error('Devam etmek için giriş yapmanız gerekiyor.');
      navigate('/giris', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error('Geçersiz tutar');
      navigate('/hesabim', { replace: true });
      return;
    }
    if (!settingsReady) return;

    const min = asNumber((minSetting as any)?.value, 10);
    const bankText = bankSetting ? jsonLikeToText((bankSetting as any).value) : '';
    const tg = asBoolLoose((tgSetting as any)?.value, false);

    setMinLimit(min);
    setBankInfo(bankText.trim() ? bankText : null);
    setTgEnabled(tg);

    if (amount < min) {
      toast.error(`Minimum yükleme tutarı ${min.toLocaleString('tr-TR')} ₺'dir`);
      navigate('/hesabim', { replace: true });
    }
  }, [amount, settingsReady, minSetting, bankSetting, tgSetting, navigate]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Panoya kopyalandı');
    } catch {
      // legacy fallback (best-effort)
      const ok = (document.execCommand as unknown as (cmd: string) => boolean)?.('copy');
      if (ok) toast.success('Panoya kopyalandı');
      else toast.error('Kopyalama başarısız');
    }
  };

  const handlePaymentConfirm = async () => {
    if (authLoading) return;

    if (!user) {
      toast.error('Oturum bulunamadı');
      navigate('/giris', { replace: true });
      return;
    }

    try {
      // ✅ provider_key standard: bank_transfer
      const created = await createWalletDepositRequest({
        amount,
        payment_method: 'bank_transfer',
        // optional: if backend accepts, you can send kind too:
        // bank_transfer_kind: kind,
      } as any).unwrap();

      if (tgEnabled && created) {
        try {
          const userName = asString((meProfile as any)?.full_name, 'Kullanıcı') || 'Kullanıcı';
          await sendTelegramNotification({
            type: 'new_deposit_request',
            depositId: created.id,
            amount: created.amount,
            userName,
            bankTransferKind: kind, // optional field; backend may ignore
          } as any).unwrap();
        } catch (e) {
          console.error('Telegram notify error:', e);
        }
      }

      toast.success('Ödeme bildirimi gönderildi');
      navigate('/hesabim', { replace: true });
    } catch (e) {
      console.error('Deposit create error:', e);
      toast.error('Bir hata oluştu');
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
            <p className="text-muted-foreground mb-4">
              Lütfen aşağıdaki hesap bilgilerine ödemenizi yapın ve &quot;Ödemeyi Yaptım&quot;
              butonuna tıklayın.
            </p>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold">Yüklenecek Tutar</Label>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-primary">
                    {amount.toLocaleString('tr-TR')} ₺
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => void copyToClipboard(String(amount))}
                    aria-label="Tutarı kopyala"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum tutar: {minLimit.toLocaleString('tr-TR')} ₺
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Seçim: <span className="font-mono">{kind}</span>
                </p>
              </div>

              <Separator />

              {bankInfo && (
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <Label className="text-base font-semibold">Banka Hesap Bilgileri</Label>
                  <div className="whitespace-pre-wrap text-sm">{bankInfo}</div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void copyToClipboard(bankInfo)}
                    aria-label="Banka bilgilerini kopyala"
                  >
                    Tamamını Kopyala
                  </Button>
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
                onClick={() => void handlePaymentConfirm()}
                disabled={creatingDeposit}
              >
                {creatingDeposit ? 'Gönderiliyor...' : 'Ödemeyi Yaptım'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </>
  );
}
