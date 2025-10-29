// =============================================================
// FILE: src/integrations/metahub/db/normalizers/blog.ts
// =============================================================
import type { UnknownRow } from "../types";

const deleteKeyIfExists = (obj: Record<string, unknown>, key: string) => {
    if (Object.prototype.hasOwnProperty.call(obj, key)) delete obj[key];
};

const toBoolLike = (v: unknown): boolean =>
    v === true || v === 1 || v === "1" || v === "true";

const stripHtml = (html: string): string => html.replace(/<[^>]*>/g, " ");
const calcReadTime = (html: string, wpm = 220): string => {
    const words = stripHtml(html).trim().split(/\s+/).filter(Boolean).length;
    return `${Math.max(1, Math.ceil(words / wpm))} dk`;
};

export function normalizeBlogRows(rows: UnknownRow[]): UnknownRow[] {
    return rows.map((r) => {
        const c: Record<string, unknown> = { ...r };
        const title = typeof c.title === "string" ? c.title : "";
        const slug = typeof c.slug === "string" ? c.slug : "";
        const excerpt = typeof c.excerpt === "string" ? c.excerpt : "";
        const content = typeof c.content === "string" ? c.content : "";

        const author = typeof c.author === "string" ? c.author : "Admin";
        const featured = typeof c.featured_image === "string" ? c.featured_image : "";
        const is_published = toBoolLike(c.is_published);
        const category =
            typeof c.category === "string" && c.category.trim() ? (c.category as string) : "Genel";
        const read_time = calcReadTime(content);

        c.title = title;
        c.slug = slug;
        c.excerpt = excerpt;
        c.content = content;
        c.author_name = author;
        c.image_url = featured;
        c.is_published = is_published;
        c.category = category;
        c.read_time = read_time;

        if (typeof c.is_featured !== "boolean") c.is_featured = false;
        deleteKeyIfExists(c, "author");
        deleteKeyIfExists(c, "featured_image");
        return c as UnknownRow;
    });
}

export default normalizeBlogRows;
