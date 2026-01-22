// =============================================================
// FILE: src/modules/functions/functions.controller.ts
// =============================================================
import type { FastifyReply, FastifyRequest } from "fastify";
import crypto from "crypto";
import { sendMailRaw } from "@/modules/mail/service";

/* -------------------- küçük yardımcılar -------------------- */

function getBaseUrl(req: FastifyRequest): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const hostHeader = req.headers.host;

  const proto =
    (typeof forwardedProto === "string" && forwardedProto.length > 0
      ? forwardedProto
      : req.protocol) || "http";

  const hostSource =
    (typeof forwardedHost === "string" && forwardedHost.length > 0
      ? forwardedHost
      : hostHeader) || "localhost:8081";

  const host = Array.isArray(hostSource) ? hostSource[0] : hostSource;

  return `${proto}://${host}`.replace(/\/+$/, "");
}

function safeString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function timingSafeEqual(a: string, b: string): boolean {
  // hex/base64 vb. farklı uzunluklar için güvenli karşılaştırma
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Shopier callback signature doğrulama:
 * - Algoritma entegrasyona göre değişebilir.
 * - Bu implementasyon "HMAC-SHA256" örnek doğrulamadır.
 * - Env'de SHOPIER_CALLBACK_SECRET varsa doğrular, yoksa doğrulamaz (accept mode).
 *
 * Varsayım: signature = HMAC_SHA256(secret, `${platform_order_id}|${payment_id}|${status}|${random_nr}|${API_key}`)
 * Eğer Shopier dokümanınız farklı ise bu stringi değiştirirsiniz.
 */
function verifyShopierSignature(args: {
  platform_order_id: string;
  payment_id: string;
  status: string;
  random_nr?: string;
  API_key?: string;
  signature: string;
}): { ok: boolean; reason?: string } {
  const secret = process.env.SHOPIER_CALLBACK_SECRET;
  if (!secret) {
    return { ok: true, reason: "secret_not_configured" };
  }

  const payload = [
    args.platform_order_id,
    args.payment_id,
    args.status,
    args.random_nr || "",
    args.API_key || "",
  ].join("|");

  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("hex");

  const ok = timingSafeEqual(expected, args.signature);
  return ok ? { ok: true } : { ok: false, reason: "invalid_signature" };
}

/**
 * Çok basit idempotency:
 * - Prod'da bunun DB seviyesinde tutulması daha doğru (orders/payments tablosu).
 * - Şimdilik process memory’de cache: restart olursa sıfırlanır.
 */
const shopierSeen = new Map<string, number>();
function shopierIdempotencyKey(platform_order_id: string, payment_id: string): string {
  return `${platform_order_id}::${payment_id}`;
}
function shopierMarkSeen(key: string) {
  shopierSeen.set(key, Date.now());
}
function shopierIsSeen(key: string): boolean {
  return shopierSeen.has(key);
}

/* ==================================================================
   SHOPIER
   FE beklediği shape: { success, form_action, form_data }
   ================================================================== */

export async function shopierCreatePayment(
  _req: FastifyRequest,
  reply: FastifyReply,
) {
  const oid = `SHP_${Date.now()}`;
  // Stub veriler
  const form_action = "https://example.com/mock-shopier";
  const form_data: Record<string, string> = {
    oid,
    currency: "TRY",
    amount: "0.00",
  };
  return reply.send({ success: true, form_action, form_data });
}

type ShopierCallbackBody = {
  platform_order_id?: string;
  status?: string;
  payment_id?: string;
  signature?: string;

  random_nr?: string;
  API_key?: string;
};

export async function shopierCallback(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as ShopierCallbackBody) || {};

  const platform_order_id = safeString(body.platform_order_id);
  const status = safeString(body.status);
  const payment_id = safeString(body.payment_id);
  const signature = safeString(body.signature);

  const random_nr = safeString(body.random_nr);
  const API_key = safeString(body.API_key);

  // Zorunlu alan doğrulama
  if (!platform_order_id || !status || !payment_id || !signature) {
    req.log.warn(
      { body_keys: Object.keys(body || {}), platform_order_id, status, payment_id },
      "shopier-callback missing required fields",
    );
    return reply.code(400).send({ success: false, error: "missing_fields" });
  }

  // Idempotency: aynı event tekrar gelirse 200 OK dön
  const idemKey = shopierIdempotencyKey(platform_order_id, payment_id);
  if (shopierIsSeen(idemKey)) {
    req.log.info(
      { platform_order_id, payment_id, status },
      "shopier-callback duplicate (idempotent ok)",
    );
    return reply.send({ success: true });
  }

  // Signature verify (opsiyonel)
  const sig = verifyShopierSignature({
    platform_order_id,
    payment_id,
    status,
    random_nr,
    API_key,
    signature,
  });

  if (!sig.ok) {
    req.log.warn(
      { platform_order_id, payment_id, status, reason: sig.reason },
      "shopier-callback signature invalid",
    );
    return reply.code(401).send({ success: false, error: sig.reason || "unauthorized" });
  }

  // İşleme al
  try {
    // Burada gerçek entegrasyonda şunları yaparsınız:
    // - platform_order_id ile order/payment kaydı bul
    // - status başarılı ise ödeme durumunu paid yap
    // - fulfillment tetikle (kod üret, stok düş, email gönder vb.)
    // - audit log

    // Şimdilik sadece log + idempotency mark
    shopierMarkSeen(idemKey);

    req.log.info(
      {
        platform_order_id,
        payment_id,
        status,
        signature_verified: process.env.SHOPIER_CALLBACK_SECRET ? true : "skipped",
      },
      "shopier-callback accepted",
    );

    return reply.send({ success: true });
  } catch (err) {
    req.log.error(
      { err, platform_order_id, payment_id, status },
      "shopier-callback failed",
    );
    return reply.code(500).send({ success: false, error: "shopier_callback_failed" });
  }
}

/* ==================================================================
   EMAIL SERVİSLERİ
   ================================================================== */

type SendEmailBody = {
  to?: string;

  // klasik
  subject?: string;
  html?: string;
  text?: string;

  // template tabanlı
  template_key?: string;
  variables?: Record<string, unknown>;
};

/** Basit template motoru:
 *  - Şimdilik sadece "order_received" için özel metin,
 *  - Diğer template_key’ler için generic fallback.
 */
function buildTemplatedEmail(
  template_key: string,
  variables: Record<string, unknown> | undefined,
): { subject?: string; html?: string; text?: string } {
  const v = (variables || {}) as Record<string, unknown>;

  if (template_key === "order_received") {
    const customer_name =
      (v.customer_name as string | undefined) ?? "Müşteri";
    const order_number =
      (v.order_number as string | undefined) ?? "—";
    const final_amount =
      (v.final_amount as string | number | undefined) ?? "0.00";
    const status = (v.status as string | undefined) ?? "İşleniyor";
    const site_name =
      (v.site_name as string | undefined) ?? "Platform";

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
      "",
      `#${order_number} numaralı siparişiniz başarıyla alındı.`,
      `Tutar: ${final_amount}`,
      `Durum: ${status}`,
      "",
      `En kısa sürede işleme alınacaktır.`,
      `${site_name} Ekibi`,
    ].join("\n");

    return { subject, html, text };
  }

  // Diğer template’ler için generic fallback
  const subject = template_key;
  const text = `Template: ${template_key}\n\n${JSON.stringify(
    variables ?? {},
    null,
    2,
  )}`;
  const html = `<pre>${text}</pre>`;
  return { subject, html, text };
}

/** Genel amaçlı e-posta gönderimi
 *  - Body:
 *     - klasik: { to, subject, html?, text? }
 *     - template: { to, template_key, variables }
 *  - SMTP / from bilgisi mail servisinden (site_settings) geliyor
 */
export async function sendEmail(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as SendEmailBody) || {};
  let { to, subject, html, text, template_key, variables } = body;

  if (!to) {
    return reply
      .code(400)
      .send({ success: false, error: "missing_to" });
  }

  // Template tabanlı istek:
  if (template_key) {
    const tpl = buildTemplatedEmail(template_key, variables);
    subject = subject || tpl.subject;
    html = html || tpl.html;
    text = text || tpl.text;
  }

  if (!subject) {
    return reply
      .code(400)
      .send({ success: false, error: "missing_subject" });
  }

  try {
    const plain =
      text ||
      (html
        ? html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
        : undefined);

    await sendMailRaw({
      to,
      subject,
      html: html || undefined,
      text: plain,
    });

    req.log.info({ to, subject, template_key }, "send-email success");
    return reply.send({ success: true });
  } catch (err) {
    req.log.error(
      { err, to, subject, template_key },
      "send-email failed",
    );
    return reply
      .code(500)
      .send({ success: false, error: "send_email_failed" });
  }
}

type ManualDeliveryEmailBody = {
  to?: string;
  customer_name?: string;
  order_number?: string;
  delivery_content?: string;
  site_name?: string;
};

/** Manuel teslimat maili
 *  - Body: { to, customer_name?, order_number?, delivery_content, site_name? }
 */
export async function manualDeliveryEmail(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as ManualDeliveryEmailBody) || {};
  const { to, customer_name, order_number, delivery_content, site_name } =
    body;

  if (!to || !delivery_content) {
    return reply
      .code(400)
      .send({
        success: false,
        error: "missing_to_or_delivery_content",
      });
  }

  const safeSiteName = site_name || "Dijital Market";
  const safeCustomer = customer_name || "Müşterimiz";

  const subject = order_number
    ? `${safeSiteName} – Sipariş Teslimatı (#${order_number})`
    : `${safeSiteName} – Sipariş Teslimatı`;

  const escapedContent = delivery_content
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br/>");

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
    "",
    order_number
      ? `#${order_number} numaralı siparişinizin teslimat detayları aşağıdadır:`
      : `Siparişinizin teslimat detayları aşağıdadır:`,
    "",
    delivery_content,
    "",
    `İyi günlerde kullanmanız dileğiyle,`,
    `${safeSiteName} Ekibi`,
  ];

  try {
    await sendMailRaw({
      to,
      subject,
      html,
      text: textLines.join("\n"),
    });

    req.log.info(
      { to, order_number },
      "manual-delivery-email sent successfully",
    );
    return reply.send({ success: true });
  } catch (err) {
    req.log.error(
      { err, to, order_number },
      "manual-delivery-email failed",
    );
    return reply
      .code(500)
      .send({
        success: false,
        error: "manual_delivery_email_failed",
      });
  }
}

/* ==================================================================
   TELEGRAM / SMM / TURKPIN STUB’LARI
   ================================================================== */

/** Telegram — sade başarı cevabı (şimdilik stub) */
export async function sendTelegramNotification(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, "telegram stub");
  return reply.send({ success: true });
}

/** SMM / Tedarikçi stub */
export async function smmApiOrder(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  req.log.info({ body: req.body }, "smm-api-order stub");
  return reply.send({
    success: true,
    order_id: `SMM_${Date.now()}`,
    status: "processing",
  });
}

export async function smmApiStatus(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  req.log.info({ body: req.body }, "smm-api-status stub");
  return reply.send({ success: true, status: "completed" });
}

/** Turkpin stub — oyun listesi */
export async function turkpinGameList(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, "turkpin-game-list stub");

  // Şimdilik boş liste dönüyoruz
  return reply.send({
    success: true,
    games: [],
  });
}

/** Turkpin stub — ürün listesi */
export async function turkpinProductList(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, "turkpin-product-list stub");

  return reply.send({
    success: true,
    products: [],
  });
}

/** Turkpin stub — bakiye */
export async function turkpinBalance(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as Record<string, unknown>) || {};
  req.log.info(body, "turkpin-balance stub");

  // FE tarafında BalanceResult tipine göre bunu daha sonra gerçek API'ye göre güncellersin
  return reply.send({
    success: true,
    balance: 0,
    currency: "TRY",
  });
}

/** Turkpin stub — create order (zaten vardı, koruyoruz) */
export async function turkpinCreateOrder(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  req.log.info({ body: req.body }, "turkpin-create-order stub");
  return reply.send({
    success: true,
    order_id: `TP_${Date.now()}`,
    status: "ok",
  });
}

/* ==================================================================
   Kullanıcı sipariş silme fonksiyonu (stub)
   ================================================================== */

type DeleteUserOrdersBody = {
  email?: string;
};

export async function deleteUserOrders(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const body = (req.body as DeleteUserOrdersBody) || {};
  const email = body.email?.trim();

  if (!email) {
    return reply
      .code(400)
      .send({ success: false, error: "missing_email" });
  }

  // Şimdilik sadece loglayıp stub cevabı dönüyoruz.
  // İleride gerçek silme logic'i orders modülüne entegre edebilirsin.
  req.log.info({ email }, "delete-user-orders stub");

  return reply.send({
    success: true,
    message: `Orders for ${email} would be deleted (stub).`,
  });
}

/* ==================================================================
   Sitemap (XML) – /functions/sitemap
   ================================================================== */

export async function sitemap(
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const base = getBaseUrl(req);

  // Şimdilik statik birkaç URL; ileride products/categories’den dinamik üretebilirsin.
  const urls: Array<{
    path: string;
    changefreq: "daily" | "weekly" | "monthly";
    priority: number;
  }> = [
    { path: "/", changefreq: "daily", priority: 1.0 },
    { path: "/urunler", changefreq: "daily", priority: 0.9 },
    { path: "/kampanyalar", changefreq: "weekly", priority: 0.7 },
    { path: "/hakkimizda", changefreq: "monthly", priority: 0.5 },
    { path: "/iletisim", changefreq: "monthly", priority: 0.5 },
  ];

  const xmlBody =
    urls
      .map((u) => {
        const loc = `${base}${u.path}`;
        return [
          "  <url>",
          `    <loc>${loc}</loc>`,
          `    <changefreq>${u.changefreq}</changefreq>`,
          `    <priority>${u.priority.toFixed(1)}</priority>`,
          "  </url>",
        ].join("\n");
      })
      .join("\n") + "\n";

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9">
${xmlBody}</urlset>`;

  return reply
    .type("application/xml; charset=utf-8")
    .send(xml);
}


/* ==================================================================
   TEST MAIL
   - FE: POST /functions/send-test-mail { to?: string }
   - If "to" missing: try req.user.email (if auth plugin attaches user)
   ================================================================== */

type SendTestMailBody = {
  to?: string;
};

type AuthUserShape = { email?: unknown };

/** req.user shape projeden projeye değişebilir; tolerant okuyoruz */
function pickReqUserEmail(req: FastifyRequest): string | undefined {
  const u = (req as unknown as { user?: AuthUserShape }).user;
  const email = u?.email;
  if (typeof email !== 'string') return undefined;
  const s = email.trim();
  return s.length ? s : undefined;
}

export async function sendTestMail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as SendTestMailBody) || {};

  // öncelik: body.to
  const to = typeof body.to === 'string' && body.to.trim() ? body.to.trim() : undefined;

  // fallback: req.user.email (auth varsa)
  const fallbackTo = pickReqUserEmail(req);

  const target = to || fallbackTo;

  if (!target) {
    return reply.code(400).send({
      ok: false,
      message: 'missing_to',
    });
  }

  const siteName = process.env.SITE_NAME || 'Platform';
  const now = new Date();
  const stamp = now.toISOString();

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
    await sendMailRaw({
      to: target,
      subject,
      html,
      text,
    });

    req.log.info({ to: target }, 'send-test-mail success');
    return reply.send({ ok: true });
  } catch (err) {
    req.log.error({ err, to: target }, 'send-test-mail failed');
    return reply.code(500).send({
      ok: false,
      message: 'send_test_mail_failed',
    });
  }
}



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
  const parse_mode = body.parse_mode === 'HTML' || body.parse_mode === 'MarkdownV2' ? body.parse_mode : undefined;

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


