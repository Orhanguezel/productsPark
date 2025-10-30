// =============================================================
// FILE: src/integrations/metahub/db/normalizers/paymentRequests.ts
// =============================================================
import type { UnknownRow } from "../types";

export function normalizePaymentRequestRows(rows: UnknownRow[]): UnknownRow[] {
  return rows.map((r) => {
    const out: UnknownRow = { ...r };
    if (typeof out.amount === "string") {
      const n = Number((out.amount as string).replace(",", "."));
      if (Number.isFinite(n)) out.amount = n;
    }
    // orders/order_items zaten nested geliyorsa dokunma
    return out;
  });
}
