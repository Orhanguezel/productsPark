// src/modules/siteSettings/fakeNotificationConfig.controller.ts
import type { FastifyReply, FastifyRequest } from "fastify";

type MySQL = { query<T = unknown[]>(sql: string, params?: unknown[]): Promise<[T, unknown]> };

function getMysql(req: FastifyRequest) {
  const s = req.server as any;
  const db = s.mysql ?? (req as any).mysql ?? s.db ?? s.mariadb ?? null;
  if (!db?.query) throw new Error("MySQL pool not found (fastify.mysql).");
  return db as MySQL;
}

const KEYS = [
  "notification_display_duration",
  "notification_interval",
  "notification_delay",
  "fake_notifications_enabled",
] as const;

function rowsToCfg(rows: Array<{ key: string; value: string }>) {
  const map = new Map(rows.map(r => [r.key, r.value]));
  const num = (k: string, d: number) => {
    const v = map.get(k);
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : d;
  };
  const bool = (k: string, d: boolean) => {
    const v = map.get(k);
    if (v === undefined) return d;
    return v === "1" || v === "true" || v === "TRUE";
  };
  return {
    notification_display_duration: num("notification_display_duration", 5),
    notification_interval: num("notification_interval", 30),
    notification_delay: num("notification_delay", 10),
    fake_notifications_enabled: bool("fake_notifications_enabled", true),
  };
}

/** PUBLIC GET (no auth) */
export async function publicGetFakeNotificationConfig(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const [rows] = await mysql.query<Array<{ key: string; value: string }>>(
    `SELECT \`key\`, \`value\` FROM site_settings WHERE \`key\` IN (${KEYS.map(() => "?").join(",")})`,
    [...KEYS]
  );
  return reply.send(rowsToCfg(rows));
}

/** ADMIN GET */
export async function getFakeNotificationConfig(req: FastifyRequest, reply: FastifyReply) {
  return publicGetFakeNotificationConfig(req, reply);
}

/** ADMIN PUT */
export async function updateFakeNotificationConfig(req: FastifyRequest, reply: FastifyReply) {
  const mysql = getMysql(req);
  const body = (req.body ?? {}) as Partial<{
    notification_display_duration: number;
    notification_interval: number;
    notification_delay: number;
    fake_notifications_enabled: boolean;
  }>;

  // idempotent upsert
  const pairs: Array<[string, string]> = [];
  if (body.notification_display_duration != null)
    pairs.push(["notification_display_duration", String(body.notification_display_duration)]);
  if (body.notification_interval != null)
    pairs.push(["notification_interval", String(body.notification_interval)]);
  if (body.notification_delay != null)
    pairs.push(["notification_delay", String(body.notification_delay)]);
  if (body.fake_notifications_enabled != null)
    pairs.push(["fake_notifications_enabled", body.fake_notifications_enabled ? "true" : "false"]);

  if (pairs.length === 0) return reply.code(400).send({ message: "empty_body" });

  for (const [key, value] of pairs) {
    await mysql.query(
      `INSERT INTO site_settings (id, \`key\`, \`value\`, created_at, updated_at)
       VALUES (UUID(), ?, ?, NOW(3), NOW(3))
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW(3)`,
      [key, value]
    );
  }

  // return fresh
  return getFakeNotificationConfig(req, reply);
}
