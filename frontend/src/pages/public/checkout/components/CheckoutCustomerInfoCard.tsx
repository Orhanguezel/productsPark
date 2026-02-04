// =============================================================
// FILE: src/pages/public/components/CheckoutCustomerInfoCard.tsx
// FINAL — better inputs + responsive grid
// =============================================================
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  setCustomerName: (v: string) => void;
  setCustomerEmail: (v: string) => void;
  setCustomerPhone: (v: string) => void;
};

export const CheckoutCustomerInfoCard: React.FC<Props> = ({
  customerName,
  customerEmail,
  customerPhone,
  setCustomerName,
  setCustomerEmail,
  setCustomerPhone,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Müşteri Bilgileri</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ad Soyad *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ad Soyad"
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-posta *</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="E-posta"
              autoComplete="email"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder="5XX XXX XX XX"
            autoComplete="tel"
            required
          />
        </div>
      </CardContent>
    </Card>
  );
};
