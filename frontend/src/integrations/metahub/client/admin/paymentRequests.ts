// =============================================================
// FILE: src/integrations/metahub/client/admin/paymentRequests.ts
// =============================================================
import { from } from "../../db/from";

export const paymentRequestsAdmin = {
  list: () =>
    from("payment_requests")
      .select("*")
      .order("created_at", { ascending: false }),

  approve: (id: string, admin_note?: string) =>
    from("payment_requests")
      .update({ status: "approved", admin_note })
      .eq("id", id),

  reject: (id: string, admin_note?: string) =>
    from("payment_requests")
      .update({ status: "rejected", admin_note })
      .eq("id", id),
};
