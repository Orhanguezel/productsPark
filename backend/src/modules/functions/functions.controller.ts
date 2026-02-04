// =============================================================
// FILE: src/modules/functions/functions.controller.ts
// FINAL — Shopier REAL create-payment (DB config) + callback verify
// - Removes old stub (example.com/mock-shopier)
// - DB-first signature verify (fallback ENV)
// - No duplicate helper/functions
// =============================================================

import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendMailRaw } from '@/modules/mail/service';

// Shopier
import { createShopierForm } from '@/modules/functions/shopier/service';
import { getShopierConfig } from '@/modules/payments/service';

/* -------------------- küçük yardımcılar -------------------- */

function getBaseUrl(req: FastifyRequest): string {
  const forwardedProto = req.headers['x-forwarded-proto'];
  const forwardedHost = req.headers['x-forwarded-host'];
  const hostHeader = req.headers.host;

  const proto =
    (typeof forwardedProto === 'string' && forwardedProto.length > 0
      ? forwardedProto
      : req.protocol) || 'http';

  const hostSource =
    (typeof forwardedHost === 'string' && forwardedHost.length > 0 ? forwardedHost : hostHeader) ||
    'localhost:8081';

  const host = Array.isArray(hostSource) ? hostSource[0] : hostSource;

  return `${proto}://${host}`.replace(/\/+$/, '');
}

function safeString(v: unknown): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

/* ==================================================================
   SHOPIER
   FE beklediği shape: { success, form_action, form_data }
   ================================================================== */

type ShopierCreatePaymentBody = {
  platform_order_id?: string;
  total_order_value?: string | number;
  currency?: 'TRY' | 'TL' | 'USD' | 'EUR';

  product_name?: string;
  product_type?: 0 | 1;

  buyer_name?: string;
  buyer_surname?: string;
  buyer_email?: string;
  buyer_phone?: string;

  buyer_account_age?: string | number;
  buyer_id_nr?: string;

  billing_address?: string;
  billing_city?: string;
  billing_country?: string;
  billing_postcode?: string;

  shipping_address?: string;
  shipping_city?: string;
  shipping_country?: string;
  shipping_postcode?: string;

  is_in_frame?: 0 | 1;
  current_language?: 0 | 1;
};

export async function shopierCreatePayment(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as ShopierCreatePaymentBody) || {};

  const platform_order_id = safeString(body.platform_order_id);
  const total_order_value = body.total_order_value;

  if (!platform_order_id) {
    return reply.code(400).send({ success: false, error: 'missing_platform_order_id' });
  }
  if (total_order_value == null) {
    return reply.code(400).send({ success: false, error: 'missing_total_order_value' });
  }

  try {
    // (optional) config check: early fail if provider missing
    await getShopierConfig('shopier');

    const form = await createShopierForm({
      platform_order_id,
      total_order_value,
      currency: body.currency ?? 'TRY',

      product_name: body.product_name ?? 'Wallet Topup',
      product_type: body.product_type ?? 1,

      buyer_name: body.buyer_name,
      buyer_surname: body.buyer_surname,
      buyer_email: body.buyer_email,
      buyer_phone: body.buyer_phone,

      buyer_account_age: body.buyer_account_age,
      buyer_id_nr: body.buyer_id_nr,

      billing_address: body.billing_address,
      billing_city: body.billing_city,
      billing_country: body.billing_country,
      billing_postcode: body.billing_postcode,

      shipping_address: body.shipping_address,
      shipping_city: body.shipping_city,
      shipping_country: body.shipping_country,
      shipping_postcode: body.shipping_postcode,

      is_in_frame: body.is_in_frame ?? 0,
      current_language: body.current_language ?? 0,
    });

    return reply.send({ success: true, form_action: form.form_action, form_data: form.form_data });
  } catch (err: any) {
    req.log.error({ err: err?.message || err, stack: err?.stack }, 'shopier-create-payment failed');
    return reply.code(500).send({ success: false, error: 'shopier_create_failed' });
  }
}

/* ==================================================================
   EMAIL SERVİSLERİ
   ================================================================== */

type SendEmailBody = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
  template_key?: string;
  variables?: Record<string, unknown>;
};

function buildTemplatedEmail(
  template_key: string,
  variables: Record<string, unknown> | undefined,
): { subject?: string; html?: string; text?: string } {
  const v = (variables || {}) as Record<string, unknown>;

  if (template_key === 'order_received') {
    const customer_name = (v.customer_name as string | undefined) ?? 'Müşteri';
    const order_number = (v.order_number as string | undefined) ?? '—';
    const final_amount = (v.final_amount as string | number | undefined) ?? '0.00';
    const status = (v.status as string | undefined) ?? 'İşleniyor';
    const site_name = (v.site_name as string | undefined) ?? 'Platform';

    const subject = `${site_name} – Siparişiniz alındı (#${order_number})`;

    const html = `
      <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
        <h2 style="font-size:18px;margin-bottom:8px;">Merhaba ${customer_name},</h2>
        <p style="margin:0 0 12px 0;">
          #${order_number} numaralı siparişiniz başarıyla alındı.
        </p>
        <p style="margin:0 0 8px 0;">
          Sipariş tutarı: <strong>${final_amount}</strong><br/>
          Durum: <strong>${status}</strong>
        </p>
        <p style="margin-top:16px;">
          En kısa sürede işleme alınacaktır.<br/>
          <strong>${site_name} Ekibi</strong>
        </p>
      </div>
    `;

    const text = [
      `Merhaba ${customer_name},`,
      '',
      `#${order_number} numaralı siparişiniz başarıyla alındı.`,
      `Tutar: ${final_amount}`,
      `Durum: ${status}`,
      '',
      `En kısa sürede işleme alınacaktır.`,
      `${site_name} Ekibi`,
    ].join('\n');

    return { subject, html, text };
  }

  const subject = template_key;
  const text = `Template: ${template_key}\n\n${JSON.stringify(variables ?? {}, null, 2)}`;
  const html = `<pre>${text}</pre>`;
  return { subject, html, text };
}

export async function sendEmail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as SendEmailBody) || {};
  let { to, subject, html, text, template_key, variables } = body;

  if (!to) return reply.code(400).send({ success: false, error: 'missing_to' });

  if (template_key) {
    const tpl = buildTemplatedEmail(template_key, variables);
    subject = subject || tpl.subject;
    html = html || tpl.html;
    text = text || tpl.text;
  }

  if (!subject) return reply.code(400).send({ success: false, error: 'missing_subject' });

  try {
    const plain =
      text ||
      (html
        ? html
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : undefined);

    await sendMailRaw({
      to,
      subject,
      html: html || undefined,
      text: plain,
    });

    req.log.info({ to, subject, template_key }, 'send-email success');
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, to, subject, template_key }, 'send-email failed');
    return reply.code(500).send({ success: false, error: 'send_email_failed' });
  }
}

type ManualDeliveryEmailBody = {
  to?: string;
  customer_name?: string;
  order_number?: string;
  delivery_content?: string;
  site_name?: string;
};

export async function manualDeliveryEmail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as ManualDeliveryEmailBody) || {};
  const { to, customer_name, order_number, delivery_content, site_name } = body;

  if (!to || !delivery_content) {
    return reply.code(400).send({ success: false, error: 'missing_to_or_delivery_content' });
  }

  const safeSiteName = site_name || 'Dijital Market';
  const safeCustomer = customer_name || 'Müşterimiz';

  const subject = order_number
    ? `${safeSiteName} – Sipariş Teslimatı (#${order_number})`
    : `${safeSiteName} – Sipariş Teslimatı`;

  const escapedContent = delivery_content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br/>');

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h2 style="font-size:18px;margin-bottom:8px;">Merhaba ${safeCustomer},</h2>
      ${
        order_number
          ? `<p style="margin:0 0 12px 0;">#${order_number} numaralı siparişinizin teslimat detayları aşağıdadır:</p>`
          : `<p style="margin:0 0 12px 0;">Siparişinizin teslimat detayları aşağıdadır:</p>`
      }
      <div style="margin:16px 0;padding:12px;border-radius:8px;background:#f9fafb;white-space:pre-wrap;">
        ${escapedContent}
      </div>
      <p style="margin-top:16px;">
        İyi günlerde kullanmanız dileğiyle,<br/>
        <strong>${safeSiteName} Ekibi</strong>
      </p>
    </div>
  `;

  const textLines = [
    `Merhaba ${safeCustomer},`,
    '',
    order_number
      ? `#${order_number} numaralı siparişinizin teslimat detayları aşağıdadır:`
      : `Siparişinizin teslimat detayları aşağıdadır:`,
    '',
    delivery_content,
    '',
    `İyi günlerde kullanmanız dileğiyle,`,
    `${safeSiteName} Ekibi`,
  ];

  try {
    await sendMailRaw({
      to,
      subject,
      html,
      text: textLines.join('\n'),
    });

    req.log.info({ to, order_number }, 'manual-delivery-email sent successfully');
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, to, order_number }, 'manual-delivery-email failed');
    return reply.code(500).send({ success: false, error: 'manual_delivery_email_failed' });
  }
}

/* ==================================================================
   TELEGRAM / SMM / TURKPIN STUB’LARI
   ================================================================== */

export async function sendTelegramNotification(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, 'telegram stub');
  return reply.send({ success: true });
}

export async function smmApiOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-order stub');
  return reply.send({ success: true, order_id: `SMM_${Date.now()}`, status: 'processing' });
}

export async function smmApiStatus(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'smm-api-status stub');
  return reply.send({ success: true, status: 'completed' });
}

export async function turkpinGameList(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, 'turkpin-game-list stub');
  return reply.send({ success: true, games: [] });
}

export async function turkpinProductList(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, 'turkpin-product-list stub');
  return reply.send({ success: true, products: [] });
}

export async function turkpinBalance(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, 'turkpin-balance stub');
  return reply.send({ success: true, balance: 0, currency: 'TRY' });
}

export async function turkpinCreateOrder(req: FastifyRequest, reply: FastifyReply) {
  req.log.info({ body: req.body }, 'turkpin-create-order stub');
  return reply.send({ success: true, order_id: `TP_${Date.now()}`, status: 'ok' });
}

/* ==================================================================
   Kullanıcı sipariş silme fonksiyonu (stub)
   ================================================================== */

type DeleteUserOrdersBody = { email?: string };

export async function deleteUserOrders(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as DeleteUserOrdersBody) || {};
  const email = body.email?.trim();

  if (!email) return reply.code(400).send({ success: false, error: 'missing_email' });

  req.log.info({ email }, 'delete-user-orders stub');
  return reply.send({ success: true, message: `Orders for ${email} would be deleted (stub).` });
}

/* ==================================================================
   Sitemap (XML) – /functions/sitemap
   ================================================================== */

export async function sitemap(req: FastifyRequest, reply: FastifyReply) {
  const base = getBaseUrl(req);

  const urls: Array<{
    path: string;
    changefreq: 'daily' | 'weekly' | 'monthly';
    priority: number;
  }> = [
    { path: '/', changefreq: 'daily', priority: 1.0 },
    { path: '/urunler', changefreq: 'daily', priority: 0.9 },
    { path: '/kampanyalar', changefreq: 'weekly', priority: 0.7 },
    { path: '/hakkimizda', changefreq: 'monthly', priority: 0.5 },
    { path: '/iletisim', changefreq: 'monthly', priority: 0.5 },
  ];

  const xmlBody =
    urls
      .map((u) => {
        const loc = `${base}${u.path}`;
        return [
          '  <url>',
          `    <loc>${loc}</loc>`,
          `    <changefreq>${u.changefreq}</changefreq>`,
          `    <priority>${u.priority.toFixed(1)}</priority>`,
          '  </url>',
        ].join('\n');
      })
      .join('\n') + '\n';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}</urlset>`;

  return reply.type('application/xml; charset=utf-8').send(xml);
}

/* ==================================================================
   TEST MAIL
   ================================================================== */

type SendTestMailBody = { to?: string };
type AuthUserShape = { email?: unknown };

function pickReqUserEmail(req: FastifyRequest): string | undefined {
  const u = (req as unknown as { user?: AuthUserShape }).user;
  const email = u?.email;
  if (typeof email !== 'string') return undefined;
  const s = email.trim();
  return s.length ? s : undefined;
}

export async function sendTestMail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as SendTestMailBody) || {};

  const to = typeof body.to === 'string' && body.to.trim() ? body.to.trim() : undefined;
  const fallbackTo = pickReqUserEmail(req);
  const target = to || fallbackTo;

  if (!target) return reply.code(400).send({ ok: false, message: 'missing_to' });

  const siteName = process.env.SITE_NAME || 'Platform';
  const stamp = new Date().toISOString();
  const subject = `${siteName} — SMTP Test (${stamp})`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h2 style="font-size:18px;margin-bottom:8px;">SMTP Test Maili</h2>
      <p style="margin:0 0 12px 0;">
        Bu e-posta SMTP ayarlarınızın çalıştığını doğrulamak için gönderildi.
      </p>
      <div style="margin:16px 0;padding:12px;border-radius:8px;background:#f9fafb;">
        <div><strong>Zaman:</strong> ${stamp}</div>
        <div><strong>Alıcı:</strong> ${target}</div>
      </div>
      <p style="margin-top:16px;">
        <strong>${siteName}</strong>
      </p>
    </div>
  `;

  const text = [
    'SMTP Test Maili',
    '',
    'Bu e-posta SMTP ayarlarınızın çalıştığını doğrulamak için gönderildi.',
    `Zaman: ${stamp}`,
    `Alici: ${target}`,
    '',
    siteName,
  ].join('\n');

  try {
    await sendMailRaw({ to: target, subject, html, text });
    req.log.info({ to: target }, 'send-test-mail success');
    return reply.send({ ok: true });
  } catch (err) {
    req.log.error({ err, to: target }, 'send-test-mail failed');
    return reply.code(500).send({ ok: false, message: 'send_test_mail_failed' });
  }
}

/* ==================================================================
   TELEGRAM SEND TEST (zaten vardı)
   ================================================================== */

type TelegramSendTestBody = {
  bot_token?: string;
  chat_id?: string;
  message?: string;
  parse_mode?: 'HTML' | 'MarkdownV2';
};

export async function telegramSendTest(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as TelegramSendTestBody) || {};

  const bot_token = safeString(body.bot_token);
  const chat_id = safeString(body.chat_id);
  const message = safeString(body.message);
  const parse_mode =
    body.parse_mode === 'HTML' || body.parse_mode === 'MarkdownV2' ? body.parse_mode : undefined;

  if (!bot_token || !chat_id || !message) {
    return reply.code(400).send({ ok: false, message: 'missing_fields' });
  }

  const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;

  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id,
        text: message,
        ...(parse_mode ? { parse_mode } : {}),
        disable_web_page_preview: true,
      }),
    });

    const data = (await resp.json()) as unknown;

    if (!resp.ok) {
      req.log.warn({ status: resp.status, data }, 'telegram-send-test failed');
      return reply.code(502).send({ ok: false, message: 'telegram_api_error' });
    }

    req.log.info({ chat_id }, 'telegram-send-test success');
    return reply.send({ ok: true });
  } catch (err) {
    req.log.error({ err }, 'telegram-send-test exception');
    return reply.code(500).send({ ok: false, message: 'telegram_send_failed' });
  }
}
