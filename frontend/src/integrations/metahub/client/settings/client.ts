// src/integrations/metahub/client/settings/client.ts
import { from } from "../../db/from";

export type SiteSettingRow = {
  id: string;
  key: string;
  value: unknown;
  created_at?: string;
  updated_at?: string;
};

export type EmailTemplate = {
  id: string;
  template_key: string;
  template_name: string;
  subject: string;
  content: string;         // HTML
  variables?: string[];    // ["user_name", ...]
  is_active: boolean | 0 | 1;
  created_at?: string;
  updated_at?: string;
};

function rowsToObject(rows: SiteSettingRow[]): Record<string, unknown> {
  const acc: Record<string, unknown> = {};
  for (const r of rows) {
    if (r.key.startsWith("telegram_template_") && typeof r.value === "object" && r.value !== null) {
      const t = r.value as { template?: string };
      acc[r.key] = t?.template ?? "";
    } else {
      acc[r.key] = r.value;
    }
  }
  return acc;
}

export const settings = {
  async getAll(): Promise<{ data: Record<string, unknown>; error: { message: string } | null }> {
    const { data, error } = await from<SiteSettingRow>("site_settings").select("*");
    if (error) return { data: {}, error: { message: error.message } };
    return { data: rowsToObject((data ?? []) as SiteSettingRow[]), error: null };
  },

  async saveAll(obj: Record<string, unknown>): Promise<{ error: { message: string } | null }> {
    const ZERO = "00000000-0000-0000-0000-000000000000";
    await from("site_settings").delete().neq("id", ZERO);

    const items = Object.entries(obj).map(([key, value]) => {
      if (key.startsWith("telegram_template_")) {
        return { key, value: value ?? "" };
      }
      return { key, value };
    });

    const { error } = await from("site_settings").insert(items);
    return error ? { error: { message: error.message } } : { error: null };
  },

  emailTemplates: {
    async list(): Promise<{ data: EmailTemplate[]; error: { message: string } | null }> {
      const { data, error } = await from<EmailTemplate>("email_templates")
        .select("*")
        .order("template_name");
      return { data: (data ?? []) as EmailTemplate[], error };
    },

    async create(payload: Omit<EmailTemplate, "id" | "created_at" | "updated_at">) {
      const { error } = await from("email_templates").insert(payload as unknown as Record<string, unknown>);
      return { error };
    },

    async update(id: string, patch: Partial<Omit<EmailTemplate, "id">>) {
      const { error } = await from("email_templates").update(patch as Record<string, unknown>).eq("id", id);
      return { error };
    },

    async remove(id: string) {
      const { error } = await from("email_templates").delete().eq("id", id);
      return { error };
    },
  },
};
