// =============================================================
// FILE: src/integrations/metahub/db/normalizers/products.ts
// =============================================================
import type { UnknownRow, ProductRow } from "../types";
import {
    asNumber,
    asNumberOrNull,
    parseStringArray,
    boolLike,
} from "./_shared";

export function normalizeProductRows(rows: (ProductRow | UnknownRow)[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...(r as Record<string, unknown>) };

        c.price = asNumber(c.price, 0);

        const hasOriginal = Object.prototype.hasOwnProperty.call(c, "original_price");
        const hasCompare = Object.prototype.hasOwnProperty.call(c, "compare_at_price");
        const origVal = hasOriginal ? c["original_price"] : hasCompare ? c["compare_at_price"] : null;
        c.original_price = origVal != null ? asNumber(origVal, 0) : null;

        c.cost = asNumberOrNull(c.cost);
        c.rating = c.rating != null ? asNumber(c.rating, 5) : 5;
        c.review_count =
            c.review_count != null ? Math.max(0, Math.floor(asNumber(c.review_count, 0))) : 0;

        if ("stock_quantity" in c) {
            const sq = asNumber(c.stock_quantity, 0);
            c.stock_quantity = Math.max(0, Math.floor(sq));
        }

        const galleryA = parseStringArray(c.gallery_urls);
        const galleryB = parseStringArray(c.images);
        let gallery = galleryA ?? galleryB ?? null;
        if ((!gallery || gallery.length === 0) && typeof c.image_url === "string" && (c.image_url as string).trim()) {
            gallery = [c.image_url as string];
        }
        c.gallery_urls = gallery;

        c.is_active = boolLike(c.is_active);
        c.is_featured = boolLike(c.is_featured);
        c.requires_shipping = boolLike(c.requires_shipping);
        c.article_enabled = boolLike(c.article_enabled);
        c.demo_embed_enabled = boolLike(c.demo_embed_enabled);

        const tryParse = <T>(x: unknown): T | null => {
            if (x == null) return null;
            if (typeof x === "string") { try { return JSON.parse(x) as T; } catch { return null; } }
            return x as T;
        };
        c.quantity_options = tryParse<Array<{ quantity: number; price: number }>>(c.quantity_options);
        c.badges = tryParse<Array<{ text: string; icon?: string | null; active: boolean }>>(c.badges);
        c.custom_fields = tryParse<Array<{ id: string; label: string; type: string; placeholder?: string | null; required: boolean }>>(c.custom_fields);

        if (c.categories && typeof c.categories === "object") {
            const k = c.categories as Record<string, unknown>;
            c.categories = {
                id: typeof k.id === "string" ? k.id : String(k.id ?? ""),
                name: typeof k.name === "string" ? k.name : "",
                slug: typeof k.slug === "string" ? k.slug : "",
            };
        }

        return c as unknown as import("../types").UnknownRow;
    });
}
