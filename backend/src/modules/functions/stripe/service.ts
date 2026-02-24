// ===================================================================
// FILE: src/modules/functions/stripe/service.ts
// Stripe Checkout Session oluşturucu
// - Stripe hosted checkout page (redirect-based, no iframe)
// - PCI DSS: Stripe halleder, kart bilgisi backende gelmez
// ===================================================================

import Stripe from 'stripe';
import { getStripeConfig } from '@/modules/payments/service';

export type StripeCreateBody = {
  merchant_oid: string;         // Bizim sipariş referansımız (metadata olarak kaydedilir)
  payment_amount_kurus: number; // Kuruş cinsinden (örn: 19990 = 199.90 TL)
  currency?: string;            // 'try' | 'usd' | 'eur' (default: 'try')

  customer_email?: string;
  product_name?: string;        // Checkout sayfasında görünür

  success_url: string;
  cancel_url: string;
};

export type StripeSessionResult = {
  session_id: string;
  checkout_url: string;  // Stripe hosted checkout page URL (tam redirect)
};

export async function createStripeCheckoutSession(
  body: StripeCreateBody,
): Promise<StripeSessionResult> {
  const cfg = await getStripeConfig('stripe');

  const stripe = new Stripe(cfg.secretKey, { apiVersion: '2026-01-28.clover' });

  const currency = (body.currency ?? 'try').toLowerCase();
  const amount = Math.round(body.payment_amount_kurus); // Stripe zaten kuruş bekler

  if (!amount || amount <= 0) throw new Error('stripe_invalid_amount');
  if (!body.merchant_oid?.trim()) throw new Error('stripe_missing_merchant_oid');

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency,
          unit_amount: amount,
          product_data: {
            name: body.product_name?.trim() || 'Sipariş Ödemesi',
          },
        },
      },
    ],
    customer_email: body.customer_email || undefined,
    success_url: `${body.success_url}?session_id={CHECKOUT_SESSION_ID}&merchant_oid=${encodeURIComponent(body.merchant_oid)}`,
    cancel_url: body.cancel_url,
    metadata: {
      merchant_oid: body.merchant_oid,
    },
    // Türkçe UI
    locale: currency === 'try' ? 'tr' : 'auto',
  });

  if (!session.url) throw new Error('stripe_checkout_url_missing');

  return {
    session_id: session.id,
    checkout_url: session.url,
  };
}
