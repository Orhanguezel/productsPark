// =============================================================
// FILE: src/modules/siteSettings/service.ts
// =============================================================

import { db } from "@/db/client";
import { siteSettings } from "./schema";
import { inArray } from "drizzle-orm";
import { env } from "@/core/env";

const SMTP_KEYS = [
  "smtp_host",
  "smtp_port",
  "smtp_username",
  "smtp_password",
  "smtp_from_email",
  "smtp_from_name",
  "smtp_ssl",
] as const;

export type SmtpSettings = {
  host: string | null;
  port: number | null;
  username: string | null;
  password: string | null;
  fromEmail: string | null;
  fromName: string | null;
  secure: boolean;
};

/** Basit string → bool helper (true/1/yes/on) */
const toBool = (v: unknown, fallback = false): boolean => {
  if (v == null) return fallback;
  const s = String(v).trim().toLowerCase();
  if (!s) return fallback;
  return ["1", "true", "yes", "on"].includes(s);
};

const toInt = (v: unknown, fallback: number | null): number | null => {
  if (v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

/**
 * SMTP ayarlarını site_settings tablosundan okur.
 * Eksikse env fallback'lerini kullanır.
 */
export async function getSmtpSettings(): Promise<SmtpSettings> {
  const rows = await db
    .select()
    .from(siteSettings)
    .where(inArray(siteSettings.key, SMTP_KEYS as readonly string[]));

  const map = new Map<string, string>();
  for (const r of rows) {
    map.set(r.key, r.value ?? "");
  }

  // DB → env fallback
  const host = map.get("smtp_host") || env.SMTP_HOST || null;
  const port = toInt(map.get("smtp_port") ?? env.SMTP_PORT, null);
  const username = map.get("smtp_username") || env.SMTP_USER || null;
  const password = map.get("smtp_password") || env.SMTP_PASS || null;
  const fromEmail =
    map.get("smtp_from_email") ||
    env.MAIL_FROM || // env MAIL_FROM varsa
    env.SMTP_USER || // yoksa SMTP_USER
    null;
  const fromName = map.get("smtp_from_name") || null;
  const secure =
    toBool(map.get("smtp_ssl"), undefined) ??
    toBool(env.SMTP_SECURE, false);

  return {
    host,
    port,
    username,
    password,
    fromEmail,
    fromName,
    secure,
  };
}
