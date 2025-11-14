// =============================================================
// FILE: src/pages/public/components/CheckoutPaymentMethodsCard.tsx
// =============================================================
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { formatPrice } from "@/lib/utils";
import type { PaymentMethod } from "./types";

type Props = {
  paymentMethods: PaymentMethod[];
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Yöntemi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <RadioGroup value={selectedPayment} onValueChange={setSelectedPayment}>
          {paymentMethods.map((method) => (
            <div key={method.id} className="border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={method.id} id={method.id} />
                <Label
                  htmlFor={method.id}
                  className="cursor-pointer font-semibold"
                >
                  {method.name}
                </Label>
              </div>

              {selectedPayment === method.id && method.id === "wallet" && (
                <div className="ml-6 mt-2 text-sm">
                  <p className="text-muted-foreground">
                    Mevcut Bakiye:{" "}
                    <span className="font-bold">
                      {formatPrice(walletBalance)}
                    </span>
                  </p>
                  {walletBalance < finalTotal && (
                    <p className="text-destructive mt-1">Yetersiz bakiye</p>
                  )}
                </div>
              )}

              {selectedPayment === method.id &&
                (method.id === "havale" || method.id === "eft") && (
                  <div className="ml-6 mt-3">
                    <div className="bg-muted p-3 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Sipariş oluşturduktan sonra ödeme bilgilerini
                        göreceksiniz.
                      </p>
                    </div>
                  </div>
                )}

              {selectedPayment === method.id && method.id === "paytr" && loading && (
                <div className="ml-6 mt-3 text-center py-8">
                  <p className="text-muted-foreground">
                    Ödeme sayfası hazırlanıyor...
                  </p>
                </div>
              )}
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
};
