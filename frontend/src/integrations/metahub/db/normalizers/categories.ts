// =============================================================
// FILE: src/integrations/metahub/db/normalizers/categories.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toNumber, toBool } from "../../core/normalize";

export function normalizeCategoryRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };

        c.name = typeof c.name === "string" ? c.name : String(c.name ?? "");
        c.slug = typeof c.slug === "string" ? c.slug : String(c.slug ?? "");

        c.description = typeof c.description === "string" ? c.description : c.description ?? null;
        c.image_url = typeof c.image_url === "string" ? c.image_url : null;
        c.icon = typeof c.icon === "string" ? c.icon : null;
        c.parent_id =
            typeof c.parent_id === "string" ? c.parent_id : c.parent_id ? String(c.parent_id) : null;

        const act = toBool(c.is_active);
        const feat = toBool(c.is_featured);
        c.is_active = act === undefined ? !!(c.is_active ?? 1) : act;
        c.is_featured = feat === undefined ? !!(c.is_featured ?? 0) : feat;

        c.display_order = toNumber(c.display_order ?? 0);

        c.article_content =
            typeof c.article_content === "string"
                ? c.article_content
                : ((c.article_content ?? "") as string);
        c.article_enabled = toBool(c.article_enabled) ?? false;

        if (typeof c.meta_title !== "string") c.meta_title = c.meta_title ?? null;
        if (typeof c.meta_description !== "string") c.meta_description = c.meta_description ?? null;
        if (typeof c.banner_image_url !== "string") c.banner_image_url = c.banner_image_url ?? null;

        return c as UnknownRow;
    });
}
