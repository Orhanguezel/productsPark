// =============================================================
// FILE: src/modules/contact/controller.ts (PUBLIC)
// =============================================================
import type { FastifyRequest, FastifyReply } from "fastify";
import { ContactCreateSchema } from "./validation";
import { repoCreateContact } from "./repository";

// 🔽 Mail + site_settings importları
import { sendMailRaw } from "@/modules/mail/service";
import { getSmtpSettings } from "@/modules/siteSettings/service";
import { db } from "@/db/client";
import { siteSettings } from "@/modules/siteSettings/schema";
import { inArray } from "drizzle-orm";

type CreateReq = FastifyRequest<{ Body: unknown }>;

/** Basit normalizer: string’i trim eder, baş/son tırnakları, ilk virgülden sonrasını atar. */
const normalizeEmailCandidate = (raw: unknown): string | null => {
  if (typeof raw !== "string") return null;
  let s = raw.trim();

  // Baş/son tek veya çift tırnak varsa kırp
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }

  // "a@x.com,b@y.com" gelmişse ilkini al
  if (s.includes(",")) {
    const first = s
      .split(",")
      .map((p) => p.trim())
      .find((p) => p.includes("@"));
    s = first ?? s;
  }

  return s && s.includes("@") ? s : null;
};

/**
 * contact_to_email / contact_email key'lerini site_settings'ten okur
 * Plain string veya JSON-string (dizi/string) kabul ediyor.
 */
async function getAdminContactEmails(): Promise<string[]> {
  try {
    const keys = ["contact_to_email", "contact_email"] as const;

    const rows = await db
      .select()
      .from(siteSettings)
      .where(inArray(siteSettings.key, keys));

    const emails: string[] = [];

    for (const row of rows) {
      const raw = row.value;
      let v: unknown = raw;

      // JSON-string olabilir ("foo@bar.com", ["a@x.com","b@y.com"] vs.)
      try {
        v = JSON.parse(raw);
      } catch {
        v = raw;
      }

      if (Array.isArray(v)) {
        for (const item of v) {
          const norm = normalizeEmailCandidate(item);
          if (norm) emails.push(norm);
        }
      } else {
        const norm = normalizeEmailCandidate(v);
        if (norm) emails.push(norm);
      }
    }

    // unique
    return Array.from(new Set(emails));
  } catch {
    return [];
  }
}

export async function createContactPublic(
  req: CreateReq,
  reply: FastifyReply
) {
  const parsed = ContactCreateSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: "INVALID_BODY", details: parsed.error.flatten() });
  }

  // Basit honeypot: website doluysa sessizce kabul et ve bırak (spam düşer)
  if (parsed.data.website && parsed.data.website.trim().length > 0) {
    return reply.code(200).send({ ok: true });
  }

  // IP tespiti: fastify({ trustProxy: true }) ise req.ip güvenilirdir.
  const ip =
    (req as any).ip ||
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0]?.trim()
      : null) ||
    ((req.socket as any)?.remoteAddress as string | null) ||
    null;

  const ua = (req.headers["user-agent"] as string) || null;

  const created = await repoCreateContact(req.server, {
    ...parsed.data,
    ip,
    user_agent: ua,
  });

  // 🔔 Contact girdikten sonra mail gönder
  try {
    // 1) Admin contact mailleri (site_settings.contact_to_email / contact_email)
    const adminEmails = await getAdminContactEmails();

    // 2) SMTP config'ten varsayılan mail adresi
    const smtpCfg = await getSmtpSettings();

    const recipients = new Set<string>();

    for (const mail of adminEmails) {
      const norm = normalizeEmailCandidate(mail);
      if (norm) recipients.add(norm);
    }

    const smtpFromNorm = normalizeEmailCandidate(smtpCfg.fromEmail);
    const smtpUserNorm = normalizeEmailCandidate(smtpCfg.username);

    if (smtpFromNorm) {
      recipients.add(smtpFromNorm);
    } else if (smtpUserNorm) {
      // Bazı SMTP'lerde username mail adresi olabiliyor
      recipients.add(smtpUserNorm);
    }

    if (recipients.size > 0) {
      const subject = `Yeni İletişim Mesajı: ${created.subject}`;

      const textLines = [
        `Yeni bir iletişim formu gönderildi.`,
        ``,
        `Ad Soyad : ${created.name}`,
        `E-posta  : ${created.email}`,
        `Telefon  : ${created.phone}`,
        `Konu     : ${created.subject}`,
        ``,
        `Mesaj:`,
        created.message,
        ``,
        `IP        : ${created.ip ?? "-"}`,
        `User-Agent: ${created.user_agent ?? "-"}`,
        ``,
        `Mesaj ID: ${created.id}`,
      ];

      const escapedMsg = created.message
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\n/g, "<br/>");

      const html = `
        <div style="font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;color:#111827;line-height:1.5;">
          <h2 style="font-size:18px;margin-bottom:8px;">Yeni İletişim Mesajı</h2>
          <p><strong>Ad Soyad:</strong> ${created.name}</p>
          <p><strong>E-posta:</strong> ${created.email}</p>
          <p><strong>Telefon:</strong> ${created.phone}</p>
          <p><strong>Konu:</strong> ${created.subject}</p>
          <p><strong>Mesaj:</strong><br/>${escapedMsg}</p>
          <hr style="margin:16px 0;border:none;border-top:1px solid #e5e7eb;" />
          <p style="font-size:12px;color:#6b7280;">
            IP: ${created.ip ?? "-"}<br/>
            User-Agent: ${created.user_agent ?? "-"}<br/>
            Mesaj ID: ${created.id}
          </p>
        </div>
      `;

      // Her alıcıya ayrı mail gönder (Zod email() yüzünden comma-separated yapmıyoruz)
      await Promise.all(
        Array.from(recipients).map((to) =>
          sendMailRaw({
            to,
            subject,
            text: textLines.join("\n"),
            html,
          })
        )
      );
    } else {
      // Hiçbir alıcı bulunamadıysa sadece logla
      req.log.warn(
        { msgId: created.id },
        "Contact mesajı için mail alıcısı bulunamadı (contact_to_email/contact_email/SMTP ayarları eksik)."
      );
    }
  } catch (e: any) {
    // Mail gönderimi başarısız olsa bile contact kaydı dursun
    req.log.error(
      { err: e, msgId: created.id },
      "Contact mesajı mail'e iletilemedi"
    );
  }

  // Public endpoint'te tüm kaydı döndürmeyelim; sadece onay + id yeterli
  return reply.code(201).send({ ok: true, id: created.id });
}
