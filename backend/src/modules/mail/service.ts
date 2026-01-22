// ===================================================================
// FILE: src/modules/mail/service.ts
// FINAL — SMTP transport + templated mail wrappers (NO static HTML)
// - sendMailRaw / sendMail: low-level SMTP sender (site_settings)
// - Templated wrappers: email_templates üzerinden gönderir
// ===================================================================

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import { env } from '@/core/env';
import {
  sendMailSchema,
  type SendMailInput,
  orderCreatedMailSchema,
  type OrderCreatedMailInput,
} from './validation';
import { getSmtpSettings, type SmtpSettings } from '@/modules/siteSettings/service';
import { z } from 'zod';
import { sendTemplatedEmail } from '@/modules/email-templates/mailer';

// ---------------- transporter cache ----------------
let cachedTransporter: Transporter | null = null;
let cachedSignature: string | null = null;

function buildSignature(cfg: SmtpSettings): string {
  return [cfg.host ?? '', cfg.port ?? '', cfg.username ?? '', cfg.secure ? '1' : '0'].join('|');
}

async function getTransporter(): Promise<Transporter> {
  const cfg = await getSmtpSettings();

  if (!cfg.host) {
    throw new Error('smtp_host_not_configured');
  }

  const port = cfg.port ?? 587;

  const signature = buildSignature({ ...cfg, port });
  if (cachedTransporter && cachedSignature === signature) {
    return cachedTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port,
    secure: cfg.secure,
    auth: cfg.username && cfg.password ? { user: cfg.username, pass: cfg.password } : undefined,
  });

  cachedTransporter = transporter;
  cachedSignature = signature;

  return transporter;
}

/**
 * LOW LEVEL sender
 * template logic YOK
 */
export async function sendMailRaw(input: SendMailInput) {
  const data = sendMailSchema.parse(input);
  const smtpCfg = await getSmtpSettings();

  const fromEmail = smtpCfg.fromEmail || env.MAIL_FROM || env.SMTP_USER || 'no-reply@example.com';
  const from = smtpCfg.fromName && fromEmail ? `${smtpCfg.fromName} <${fromEmail}>` : fromEmail;

  const transporter = await getTransporter();

  return transporter.sendMail({
    from,
    to: data.to,
    subject: data.subject,
    text: data.text,
    html: data.html,
  });
}

/**
 * Backward-compatible alias
 */
export async function sendMail(input: SendMailInput) {
  return sendMailRaw(input);
}

/* ==================================================================
   TEMPLATE-BASED MAIL WRAPPERS (seed ile birebir)
   ================================================================== */

/**
 * ORDER CREATED (template_key: order_received)
 * Seed variables:
 *  - customer_name, order_number, final_amount, status, site_name
 */
export async function sendOrderCreatedMail(input: OrderCreatedMailInput) {
  const data = orderCreatedMailSchema.parse(input);

  return sendTemplatedEmail({
    to: data.to,
    key: 'order_received',
    locale: data.locale ?? null,
    params: {
      customer_name: data.customer_name,
      order_number: data.order_number,
      final_amount: data.final_amount,
      status: data.status,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= DEPOSIT SUCCESS (deposit_success) ================= */

const depositSuccessMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  amount: z.union([z.string(), z.number()]),
  new_balance: z.union([z.string(), z.number()]),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type DepositSuccessMailInput = z.infer<typeof depositSuccessMailSchema>;

/**
 * Seed variables:
 *  - user_name, amount, new_balance, site_name
 */
export async function sendDepositSuccessMail(input: DepositSuccessMailInput) {
  const data = depositSuccessMailSchema.parse(input);

  const amountStr = typeof data.amount === 'number' ? data.amount.toFixed(2) : String(data.amount);
  const newBalanceStr =
    typeof data.new_balance === 'number' ? data.new_balance.toFixed(2) : String(data.new_balance);

  return sendTemplatedEmail({
    to: data.to,
    key: 'deposit_success',
    locale: data.locale ?? null,
    params: {
      user_name: data.user_name,
      amount: amountStr,
      new_balance: newBalanceStr,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= TICKET REPLIED (ticket_replied) ================= */

const ticketRepliedMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  ticket_id: z.string(),
  ticket_subject: z.string(),
  reply_message: z.string(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type TicketRepliedMailInput = z.infer<typeof ticketRepliedMailSchema>;

/**
 * Seed variables:
 *  - user_name, ticket_id, ticket_subject, reply_message, site_name
 */
export async function sendTicketRepliedMail(input: TicketRepliedMailInput) {
  const data = ticketRepliedMailSchema.parse(input);

  return sendTemplatedEmail({
    to: data.to,
    key: 'ticket_replied',
    locale: data.locale ?? null,
    params: {
      user_name: data.user_name,
      ticket_id: data.ticket_id,
      ticket_subject: data.ticket_subject,
      reply_message: data.reply_message,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= WELCOME (welcome) ================= */

const welcomeMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  user_email: z.string().email(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type WelcomeMailInput = z.infer<typeof welcomeMailSchema>;

/**
 * Seed variables:
 *  - user_name, user_email, site_name
 */
export async function sendWelcomeMail(input: WelcomeMailInput) {
  const data = welcomeMailSchema.parse(input);

  return sendTemplatedEmail({
    to: data.to,
    key: 'welcome',
    locale: data.locale ?? null,
    params: {
      user_name: data.user_name,
      user_email: data.user_email,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= PASSWORD CHANGED (password_changed) ================= */

const passwordChangedMailSchema = z.object({
  to: z.string().email(),
  user_name: z.string(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type PasswordChangedMailInput = z.infer<typeof passwordChangedMailSchema>;

/**
 * Seed variables:
 *  - user_name, site_name
 */
export async function sendPasswordChangedMail(input: PasswordChangedMailInput) {
  const data = passwordChangedMailSchema.parse(input);

  return sendTemplatedEmail({
    to: data.to,
    key: 'password_changed',
    locale: data.locale ?? null,
    params: {
      user_name: data.user_name,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= PASSWORD RESET (password_reset) ================= */

const passwordResetMailSchema = z.object({
  to: z.string().email(),
  reset_link: z.string().min(1),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type PasswordResetMailInput = z.infer<typeof passwordResetMailSchema>;

/**
 * Seed variables:
 *  - reset_link, site_name
 */
export async function sendPasswordResetMail(input: PasswordResetMailInput) {
  const data = passwordResetMailSchema.parse(input);

  return sendTemplatedEmail({
    to: data.to,
    key: 'password_reset',
    locale: data.locale ?? null,
    params: {
      reset_link: data.reset_link,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= ORDER COMPLETED (order_completed) ================= */

const orderCompletedMailSchema = z.object({
  to: z.string().email(),
  customer_name: z.string(),
  order_number: z.string(),
  final_amount: z.union([z.string(), z.number()]),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type OrderCompletedMailInput = z.infer<typeof orderCompletedMailSchema>;

/**
 * Seed variables:
 *  - customer_name, order_number, final_amount, site_name
 */
export async function sendOrderCompletedMail(input: OrderCompletedMailInput) {
  const data = orderCompletedMailSchema.parse(input);

  const finalAmountStr =
    typeof data.final_amount === 'number'
      ? data.final_amount.toFixed(2)
      : String(data.final_amount);

  return sendTemplatedEmail({
    to: data.to,
    key: 'order_completed',
    locale: data.locale ?? null,
    params: {
      customer_name: data.customer_name,
      order_number: data.order_number,
      final_amount: finalAmountStr,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= ORDER CANCELLED (order_cancelled) ================= */

const orderCancelledMailSchema = z.object({
  to: z.string().email(),
  customer_name: z.string(),
  order_number: z.string(),
  final_amount: z.union([z.string(), z.number()]),
  cancellation_reason: z.string(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type OrderCancelledMailInput = z.infer<typeof orderCancelledMailSchema>;

/**
 * Seed variables:
 *  - customer_name, order_number, final_amount, cancellation_reason, site_name
 */
export async function sendOrderCancelledMail(input: OrderCancelledMailInput) {
  const data = orderCancelledMailSchema.parse(input);

  const finalAmountStr =
    typeof data.final_amount === 'number'
      ? data.final_amount.toFixed(2)
      : String(data.final_amount);

  return sendTemplatedEmail({
    to: data.to,
    key: 'order_cancelled',
    locale: data.locale ?? null,
    params: {
      customer_name: data.customer_name,
      order_number: data.order_number,
      final_amount: finalAmountStr,
      cancellation_reason: data.cancellation_reason,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}

/* ================= ORDER ITEM DELIVERY (order_item_delivery) ================= */

const orderItemDeliveryMailSchema = z.object({
  to: z.string().email(),
  customer_name: z.string(),
  order_number: z.string(),
  product_name: z.string(),
  delivery_content: z.string(),
  site_name: z.string().optional(),
  locale: z.string().optional(),
});

export type OrderItemDeliveryMailInput = z.infer<typeof orderItemDeliveryMailSchema>;

/**
 * Seed variables:
 *  - customer_name, order_number, product_name, delivery_content, site_name
 */
export async function sendOrderItemDeliveryMail(input: OrderItemDeliveryMailInput) {
  const data = orderItemDeliveryMailSchema.parse(input);

  return sendTemplatedEmail({
    to: data.to,
    key: 'order_item_delivery',
    locale: data.locale ?? null,
    params: {
      customer_name: data.customer_name,
      order_number: data.order_number,
      product_name: data.product_name,
      delivery_content: data.delivery_content,
      site_name: data.site_name ?? 'Dijital Market',
    },
  });
}
