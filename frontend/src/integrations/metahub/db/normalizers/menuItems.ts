// =============================================================
// FILE: src/integrations/metahub/db/normalizers/menuItems.ts
// =============================================================
import type { UnknownRow } from "../types";
import { toBool } from "../../core/normalize";

export function normalizeMenuItemRows(rows: UnknownRow[]): UnknownRow[] {
  return rows.map((r) => {
    const c: Record<string, unknown> = { ...r };

    // title: string
    if (typeof c.title !== "string") c.title = String(c.title ?? "");

    // url / href fallback
    const rawUrl = typeof c.url === "string" ? c.url : undefined;
    const rawHref = typeof c.href === "string" ? c.href : undefined;
    c.url = rawUrl ?? rawHref ?? "#";

    // icon / section
    c.icon = typeof c.icon === "string" ? c.icon : null;
    c.section_id = typeof c.section_id === "string" ? c.section_id : null;

    // display_order / position / order_num uyumu
    const toNum = (v: unknown) => {
      if (typeof v === "number") return v;
      const n = Number(v as unknown);
      return Number.isFinite(n) ? n : 0;
    };
    const pos = c.position != null ? toNum(c.position) : undefined;
    const ord = c.order_num != null ? toNum(c.order_num) : undefined;
    const disp = c.display_order != null ? toNum(c.display_order) : undefined;
    c.position = pos ?? ord ?? disp ?? 0;
    c.order_num = ord ?? pos ?? disp ?? 0;
    c.display_order = disp ?? ord ?? pos ?? 0;

    // is_active → kesin boolean
    const b = toBool(c.is_active);
    c.is_active = b === undefined ? false : b;

    // location public'te gelmeyebilir → section varsa footer, yoksa header
    const loc = c.location;
    if (loc !== "header" && loc !== "footer") {
      c.location = c.section_id ? "footer" : "header";
    }

    return c as UnknownRow;
  });
}
