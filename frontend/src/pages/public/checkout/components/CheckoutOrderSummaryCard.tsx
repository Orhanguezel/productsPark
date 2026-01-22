// =============================================================
// FILE: src/pages/public/checkout/components/CheckoutOrderSummaryCard.tsx
// FINAL — dynamic payment methods + TS-safe narrowing
// =============================================================
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/utils';
import type { CheckoutData } from '@/integrations/types';

type CartItemRenderable = {
  id: string;
  quantity: number;
  products: { name: string; price: number };
};

type UiPaymentId = 'paytr' | 'shopier' | 'wallet' | 'bank_transfer' | 'havale' | 'eft';

const isRecord = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === 'object' && !Array.isArray(x);

const toNum = (v: unknown, d = 0): number => {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'string') {
    const n = Number(v.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : d;
};

const toStr = (v: unknown, d = ''): string => {
  if (typeof v === 'string') return v;
  if (v == null) return d;
  return String(v);
};

function asRenderableCartItem(x: unknown): CartItemRenderable | null {
  if (!isRecord(x)) return null;

  const id = toStr(x.id).trim();
  if (!id) return null;

  const quantity = toNum(x.quantity, 0);
  if (!Number.isFinite(quantity) || quantity <= 0) return null;

  const productsRaw = x.products;
  if (!isRecord(productsRaw)) return null;

  const name = toStr(productsRaw.name).trim();
  const price = toNum(productsRaw.price, NaN);

  if (!name) return null;
  if (!Number.isFinite(price) || price < 0) return null;

  return { id, quantity, products: { name, price } };
}

const toUiPaymentId = (v: unknown): UiPaymentId | '' => {
  const s = typeof v === 'string' ? v.trim() : '';
  switch (s) {
    case 'paytr':
    case 'shopier':
    case 'wallet':
    case 'bank_transfer':
    case 'havale':
    case 'eft':
      return s;
    default:
      return '';
  }
};

type Props = {
  checkoutData: CheckoutData;
  selectedPayment: string;
  commissionRate: number;
  commission: number;
  finalTotal: number;
  onSubmit: () => void | Promise<void>;
  loading: boolean;
  walletBalance: number;
};

export const CheckoutOrderSummaryCard: React.FC<Props> = ({
  checkoutData,
  selectedPayment,
  commissionRate,
  commission,
  finalTotal,
  onSubmit,
  loading,
  walletBalance,
}) => {
  const items = (checkoutData.cartItems ?? [])
    .map(asRenderableCartItem)
    .filter((x): x is CartItemRenderable => x !== null);

  const payId = toUiPaymentId(selectedPayment);
  const isWallet = payId === 'wallet';
  const walletInsufficient = isWallet && walletBalance < finalTotal;

  const buttonLabel = loading
    ? 'İşleniyor...'
    : payId === 'paytr' || payId === 'shopier'
    ? 'Kredi Kartı ile Öde'
    : payId === 'bank_transfer' || payId === 'havale' || payId === 'eft'
    ? 'Havale/EFT ile Devam Et'
    : payId === 'wallet'
    ? 'Cüzdan ile Öde'
    : 'Ödemeyi Tamamla';

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Sipariş Özeti</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.products.name} x{item.quantity}
              </span>
              <span>{formatPrice(item.products.price * item.quantity)}</span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ara Toplam</span>
            <span className="font-semibold">{formatPrice(checkoutData.subtotal)}</span>
          </div>

          {checkoutData.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>İndirim</span>
              <span>-{formatPrice(checkoutData.discount)}</span>
            </div>
          )}

          {commission > 0 && commissionRate > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Ödeme Komisyonu ({commissionRate}%)</span>
              <span>+{formatPrice(commission)}</span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between text-lg font-bold">
            <span>Toplam</span>
            <span className="text-primary">{formatPrice(finalTotal)}</span>
          </div>
        </div>

        <Button
          onClick={() => void onSubmit()}
          disabled={loading || walletInsufficient}
          className="w-full"
          size="lg"
        >
          {buttonLabel}
        </Button>
      </CardContent>
    </Card>
  );
};
