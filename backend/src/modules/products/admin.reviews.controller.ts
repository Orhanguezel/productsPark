// =============================================================
// FILE: src/modules/products/admin.reviews.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { randomUUID } from "crypto";
import { products, productReviews } from "./schema";
import {
  productReviewCreateSchema,
  productReviewUpdateSchema,
} from "./validation";

const now = () => new Date();

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  const s = String(v ?? "").toLowerCase();
  return s === "1" || s === "true";
}
const toNumber = (v: unknown) => (v == null ? 0 : Number(v) || 0);

/* rating & review_count aggregate */
async function recomputeRatingAndCount(productId: string) {
  const [{ avgRating, cnt }] = await db
    .select({
      avgRating: sql<number>`COALESCE(AVG(${productReviews.rating}), 0)`,
      cnt: sql<number>`COUNT(*)`,
    })
    .from(productReviews)
    .where(
      and(
        eq(productReviews.product_id, productId),
        eq(productReviews.is_active, 1 as any)
      )
    );

  const rating = toNumber(avgRating);
  const reviewCount = toNumber(cnt);

  await db
    .update(products)
    .set({
      rating: sql`${rating}`,
      review_count: sql`${reviewCount}`,
      updated_at: now(),
    })
    .where(eq(products.id, productId));
}

/* LIST */
export const adminListProductReviews: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const q = (req.query || {}) as {
    only_active?: string | number | boolean;
    order?: "asc" | "desc";
  };

  const conds = [eq(productReviews.product_id, id)];
  if (q.only_active !== undefined) {
    conds.push(
      eq(productReviews.is_active, toBool(q.only_active) as any)
    );
  }

  const orderBy =
    q.order === "asc"
      ? asc(productReviews.review_date)
      : desc(productReviews.review_date);

  const rows = await db
    .select()
    .from(productReviews)
    .where(and(...conds))
    .orderBy(orderBy);

  return reply.send(rows);
};

/* CREATE */
export const adminCreateProductReview: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  try {
    const [p] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.id, id))
      .limit(1);
    if (!p)
      return reply
        .code(404)
        .send({ error: { message: "product_not_found" } });

    const input = productReviewCreateSchema.parse({
      ...(req.body || {}),
      product_id: id,
    });

    const row: any = {
      ...input,
      id: input.id ?? randomUUID(),
      is_active:
        input.is_active === undefined
          ? true
          : toBool(input.is_active),
      review_date: input.review_date ? new Date(input.review_date) : now(),
      created_at: now(),
      updated_at: now(),
    };

    await db.insert(productReviews).values(row);

    await recomputeRatingAndCount(id);

    return reply.code(201).send(row);
  } catch (e: any) {
    if (e?.name === "ZodError")
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

/* UPDATE */
export const adminUpdateProductReview: RouteHandler = async (req, reply) => {
  const { id, reviewId } = req.params as { id: string; reviewId: string };
  try {
    const patch = productReviewUpdateSchema.parse({
      ...(req.body || {}),
      product_id: id,
    });

    const upd: any = { ...patch, updated_at: now() };
    if (patch.review_date !== undefined) {
      upd.review_date = patch.review_date
        ? new Date(patch.review_date)
        : null;
    }
    if (patch.is_active !== undefined) {
      upd.is_active = toBool(patch.is_active);
    }

    await db
      .update(productReviews)
      .set(upd)
      .where(
        and(
          eq(productReviews.id, reviewId),
          eq(productReviews.product_id, id)
        )
      );

    const [row] = await db
      .select()
      .from(productReviews)
      .where(eq(productReviews.id, reviewId))
      .limit(1);
    if (!row)
      return reply.code(404).send({ error: { message: "not_found" } });

    await recomputeRatingAndCount(id);

    return reply.send(row);
  } catch (e: any) {
    if (e?.name === "ZodError")
      return reply
        .code(422)
        .send({
          error: { message: "validation_error", details: e.issues },
        });
    req.log.error(e);
    return reply.code(500).send({ error: { message: "internal_error" } });
  }
};

/* TOGGLE ACTIVE */
export const adminToggleReviewActive: RouteHandler = async (req, reply) => {
  const { id, reviewId } = req.params as { id: string; reviewId: string };
  const v = toBool((req.body as any)?.is_active);

  await db
    .update(productReviews)
    .set({ is_active: v, updated_at: now() } as any)
    .where(
      and(
        eq(productReviews.id, reviewId),
        eq(productReviews.product_id, id)
      )
    );

  const [row] = await db
    .select()
    .from(productReviews)
    .where(eq(productReviews.id, reviewId))
    .limit(1);
  if (!row)
    return reply.code(404).send({ error: { message: "not_found" } });

  await recomputeRatingAndCount(id);

  return reply.send(row);
};

/* DELETE */
export const adminDeleteProductReview: RouteHandler = async (req, reply) => {
  const { id, reviewId } = req.params as { id: string; reviewId: string };
  await db
    .delete(productReviews)
    .where(
      and(
        eq(productReviews.id, reviewId),
        eq(productReviews.product_id, id)
      )
    );

  await recomputeRatingAndCount(id);

  return reply.send({ ok: true });
};

/* REPLACE uç – mevcut behavior ile uyumlu kalsın */
export const adminReplaceReviews: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const body = (req.body || {}) as { reviews?: any[]; items?: any[] };
  const items: any[] = Array.isArray(body.reviews)
    ? body.reviews
    : Array.isArray(body.items)
    ? body.items
    : [];

  const rowsToInsert = items.map((raw) => {
    const parsed = productReviewCreateSchema.partial().parse(raw);
    return {
      id: parsed.id ?? randomUUID(),
      product_id: id,
      user_id: parsed.user_id ?? null,
      rating: toNumber(parsed.rating) || 5,
      comment: parsed.comment ?? null,
      is_active: toBool(parsed.is_active ?? 1) ? 1 : 0,
      customer_name: parsed.customer_name ?? null,
      review_date: parsed.review_date ?? now(),
      created_at: now(),
      updated_at: now(),
    };
  });

  await (db.delete(productReviews) as any).where(
    eq(productReviews.product_id, id)
  );
  if (rowsToInsert.length) {
    await (db.insert(productReviews) as any).values(rowsToInsert);
  }

  await recomputeRatingAndCount(id);

  return reply.send({ ok: true as const });
};
