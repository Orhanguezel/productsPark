// src/modules/userRoles/service.ts
import { db } from "@/db/client";
import { userRoles } from "./schema";
import { eq } from "drizzle-orm";

export type RoleName = "admin" | "moderator" | "user";

const ROLE_WEIGHT: Record<RoleName, number> = {
  admin: 3,
  moderator: 2,
  user: 1,
};

/** Kullanıcının rollerini çekip en yüksek öncelikli olanı döndürür. */
export async function getPrimaryRole(userId: string): Promise<RoleName> {
  const rows = await db.select().from(userRoles).where(eq(userRoles.user_id, userId));
  if (!rows?.length) return "user";
  let best: RoleName = "user";
  let bestWeight = 0;
  for (const r of rows) {
    const w = ROLE_WEIGHT[r.role as RoleName] ?? 0;
    if (w > bestWeight) {
      best = r.role as RoleName;
      bestWeight = w;
    }
  }
  return best;
}
