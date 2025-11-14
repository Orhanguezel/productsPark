// =============================================================
// FILE: src/pages/public/components/CheckoutOrderSummaryCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import type { CheckoutData } from "./types";

type Props = {
  checkoutData: CheckoutData;
  selectedPayment: string;
  paytrCommission: number;
  shopierCommission: number;
  paytrHavaleCommission: number;
  commission: number;
  finalTotal: number;
  onSubmit: () => void | Promise<void>;
  loading: boolean;
  walletBalance: number;
};

export const CheckoutOrderSummaryCard: React.FC<Props> = ({
  checkoutData,
  selectedPayment,
  paytrCommission,
  shopierCommission,
  paytrHavaleCommission,
  commission,
  finalTotal,
  onSubmit,
  loading,
  walletBalance,
}) => {
  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Sipariş Özeti</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {checkoutData.cartItems.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.products.name} x{item.quantity}
              </span>
              <span>
                {formatPrice(item.products.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Ara Toplam</span>
            <span className="font-semibold">
              {formatPrice(checkoutData.subtotal)}
            </span>
          </div>
          {checkoutData.discount > 0 && (
            <div className="flex justify-between text-primary">
              <span>İndirim</span>
              <span>-{formatPrice(checkoutData.discount)}</span>
            </div>
          )}
          {commission > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>
                Ödeme Komisyonu (
                {selectedPayment === "paytr"
                  ? paytrCommission
                  : selectedPayment === "paytr_havale"
                  ? paytrHavaleCommission
                  : shopierCommission}
                %)
              </span>
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
          disabled={
            loading ||
            (selectedPayment === "wallet" && walletBalance < finalTotal)
          }
          className="w-full"
          size="lg"
        >
          {loading
            ? "İşleniyor..."
            : selectedPayment === "paytr"
            ? "Kredi Kartı ile Öde"
            : selectedPayment === "paytr_havale"
            ? "Havale/EFT ile Öde"
            : "Ödemeyi Tamamla"}
        </Button>
      </CardContent>
    </Card>
  );
};
