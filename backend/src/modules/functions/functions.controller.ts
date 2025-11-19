import type { FastifyReply, FastifyRequest } from "fastify";

/** Shopier — FE beklediği shape: { success, form_action, form_data } */
export async function shopierCreatePayment(
  _req: FastifyRequest,
  reply: FastifyReply
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

export async function shopierCallback(
  _req: FastifyRequest,
  reply: FastifyReply
) {
  return reply.send({ success: true });
}

/* ==================================================================
   EMAIL SERVİSLERİ
   ================================================================== */

import { sendMailRaw } from "@/modules/mail/service";

type SendEmailBody = {
  to?: string;
  subject?: string;
  html?: string;
  text?: string;
};

/** Genel amaçlı e-posta gönderimi
 *  - Body: { to, subject, html?, text? }
 *  - SMTP / from bilgisi mail servisinden (site_settings) geliyor
 */
export async function sendEmail(req: FastifyRequest, reply: FastifyReply) {
  const body = (req.body as SendEmailBody) || {};
  const { to, subject, html, text } = body;

  if (!to || !subject) {
    return reply
      .code(400)
      .send({ success: false, error: "missing_to_or_subject" });
  }

  try {
    // HTML yoksa text’i kullan, text yoksa HTML’den kaba plain-text üret
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

    req.log.info({ to, subject }, "send-email success");
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, to, subject }, "send-email failed");
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
 *  - SMTP ayarları + from bilgisi yine mail servisinden geliyor
 */
export async function manualDeliveryEmail(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const body = (req.body as ManualDeliveryEmailBody) || {};
  const { to, customer_name, order_number, delivery_content, site_name } =
    body;

  if (!to || !delivery_content) {
    return reply
      .code(400)
      .send({ success: false, error: "missing_to_or_delivery_content" });
  }

  const safeSiteName = site_name || "Dijital Market";
  const safeCustomer = customer_name || "Müşterimiz";

  const subject = order_number
    ? `${safeSiteName} – Sipariş Teslimatı (#${order_number})`
    : `${safeSiteName} – Sipariş Teslimatı`;

  const html = `
    <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
      <h2 style="font-size:18px;margin-bottom:8px;">Merhaba ${safeCustomer},</h2>
      ${
        order_number
          ? `<p style="margin:0 0 12px 0;">#${order_number} numaralı siparişinizin teslimat detayları aşağıdadır:</p>`
          : `<p style="margin:0 0 12px 0;">Siparişinizin teslimat detayları aşağıdadır:</p>`
      }
      <div style="margin:16px 0;padding:12px;border-radius:8px;background:#f9fafb;white-space:pre-wrap;">
        ${delivery_content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;")
          .replace(/\n/g, "<br/>")}
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
    delivery_content || "",
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
      "manual-delivery-email sent successfully"
    );
    return reply.send({ success: true });
  } catch (err) {
    req.log.error({ err, to, order_number }, "manual-delivery-email failed");
    return reply
      .code(500)
      .send({ success: false, error: "manual_delivery_email_failed" });
  }
}

/** Telegram — sade başarı cevabı (şimdilik stub) */
export async function sendTelegramNotification(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { chat_id, text } =
    (req.body as { chat_id?: string; text?: string }) || {};
  req.log.info({ chat_id, text }, "telegram stub");
  return reply.send({ success: true });
}

/** SMM / Tedarikçi stub */
export async function smmApiOrder(
  req: FastifyRequest,
  reply: FastifyReply
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
  reply: FastifyReply
) {
  req.log.info({ body: req.body }, "smm-api-status stub");
  return reply.send({ success: true, status: "completed" });
}

/** Turkpin stub */
export async function turkpinCreateOrder(
  req: FastifyRequest,
  reply: FastifyReply
) {
  req.log.info({ body: req.body }, "turkpin-create-order stub");
  return reply.send({
    success: true,
    order_id: `TP_${Date.now()}`,
    status: "ok",
  });
}
