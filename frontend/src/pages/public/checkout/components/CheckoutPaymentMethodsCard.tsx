// =============================================================
// FILE: src/pages/public/checkout/components/CheckoutPaymentMethodsCard.tsx
// FINAL — dynamic payment method keys + TS-safe narrowing
// - selectedPayment: string (provider key)
// - setSelectedPayment: (v: string) => void
// =============================================================
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { formatPrice } from '@/lib/utils';
import type { CheckoutPaymentMethodOption } from '@/integrations/types';

type UiPaymentId = 'wallet' | 'bank_transfer' | 'havale' | 'eft' | 'paytr' | 'shopier';

const toUiPaymentId = (v: unknown): UiPaymentId | '' => {
  const s = typeof v === 'string' ? v.trim() : '';
  switch (s) {
    case 'wallet':
    case 'bank_transfer':
    case 'havale':
    case 'eft':
    case 'paytr':
    case 'shopier':
      return s;
    default:
      return '';
  }
};

type Props = {
  paymentMethods: CheckoutPaymentMethodOption[];
  selectedPayment: string;
  setSelectedPayment: (v: string) => void;
  walletBalance: number;
  finalTotal: number;
  loading: boolean;
};

export const CheckoutPaymentMethodsCard: React.FC<Props> = ({
  paymentMethods,
  selectedPayment,
  setSelectedPayment,
  walletBalance,
  finalTotal,
  loading,
}) => {
  const selected = toUiPaymentId(selectedPayment);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Yöntemi</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <RadioGroup value={selectedPayment} onValueChange={(v) => setSelectedPayment(String(v))}>
          {paymentMethods.map((method) => {
            const methodId = String((method as any).id ?? '').trim();
            const methodName = String((method as any).name ?? methodId).trim();

            const active = selectedPayment === methodId;
            const mid = toUiPaymentId(methodId);

            const isWallet = active && mid === 'wallet';
            const isBank = active && (mid === 'bank_transfer' || mid === 'havale' || mid === 'eft');
            const isPaytr = active && mid === 'paytr';
            const isShopier = active && mid === 'shopier';

            return (
              <div key={methodId} className="border rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value={methodId} id={methodId} />
                  <Label htmlFor={methodId} className="cursor-pointer font-semibold">
                    {methodName}
                  </Label>
                </div>

                {isWallet && (
                  <div className="ml-6 mt-2 text-sm">
                    <p className="text-muted-foreground">
                      Mevcut Bakiye: <span className="font-bold">{formatPrice(walletBalance)}</span>
                    </p>
                    {walletBalance < finalTotal && (
                      <p className="text-destructive mt-1">Yetersiz bakiye</p>
                    )}
                  </div>
                )}

                {isBank && (
                  <div className="ml-6 mt-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Sipariş oluşturduktan sonra ödeme bilgilerini göreceksiniz.
                      </p>
                    </div>
                  </div>
                )}

                {(isPaytr || isShopier) && loading && (
                  <div className="ml-6 mt-3 text-center py-8">
                    <p className="text-muted-foreground">Ödeme sayfası hazırlanıyor...</p>
                  </div>
                )}
              </div>
            );
          })}
        </RadioGroup>

        {/* Optional debugging / hint: */}
        {selected === '' && selectedPayment && (
          <p className="text-xs text-muted-foreground">
            Seçili ödeme anahtarı tanınmıyor: <span className="font-mono">{selectedPayment}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};
