// src/modules/cart/controller.ts
import type { RouteHandler } from "fastify";
import { randomUUID } from "crypto";
import { and, asc, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { cartItems, type CartItemInsert } from "./schema";
import { products } from "../products/schema";
import { categories } from "../categories/schema";
import {
  cartItemListQuerySchema,
  cartItemCreateSchema,
  cartItemUpdateSchema,
  type CartItemListQuery,
  type CartItemCreateInput,
  type CartItemUpdateInput,
} from "./validation";

function toNum(x: unknown): number {
  if (typeof x === "number") return Number.isFinite(x) ? x : 0;
  const n = Number(x as unknown);
  return Number.isFinite(n) ? n : 0;
}
function parseJson<T>(s?: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}
function iso(d?: Date | string | null): string | undefined {
  if (!d) return undefined;
  const dt = typeof d === "string" ? new Date(d) : d;
  return Number.isNaN(dt.getTime()) ? undefined : dt.toISOString();
}

function mapRow(row: {
  cart: typeof cartItems.$inferSelect;
  prod: typeof products.$inferSelect | null;
  cat: typeof categories.$inferSelect | null;
}) {
  const p = row.prod;
  return {
    id: row.cart.id,
    user_id: row.cart.user_id,
    product_id: row.cart.product_id,
    quantity: toNum(row.cart.quantity),
    selected_options: parseJson<Record<string, unknown>>(row.cart.options),
    created_at: iso(row.cart.created_at as unknown as string),
    updated_at: iso(row.cart.updated_at as unknown as string),
    products: p
      ? {
          id: p.id,
          name: p.name,
          slug: p.slug,
          price: toNum(p.price),
          image_url: p.image_url ?? null,
          delivery_type: p.delivery_type ?? null,
          stock_quantity:
            p.stock_quantity == null ? null : toNum(p.stock_quantity),
          custom_fields:
            parseJson<ReadonlyArray<Record<string, unknown>>>(
              p.custom_fields as any
            ) ??
            (Array.isArray(p.custom_fields)
              ? (p.custom_fields as any)
              : null),
          quantity_options:
            parseJson<{ quantity: number; price: number }[]>(
              p.quantity_options as any
            ) ?? null,
          api_provider_id: p.api_provider_id ?? null,
          api_product_id: p.api_product_id ?? null,
          api_quantity:
            p.api_quantity == null ? null : toNum(p.api_quantity),
          category_id: p.category_id ?? null,
          categories: row.cat
            ? { id: row.cat.id, name: row.cat.name }
            : null,
        }
      : null,
  };
}

type SortKey = "created_at" | "updated_at";

/** GET /cart_items */
export const listCartItems: RouteHandler = async (req, reply) => {
  try {
    const q = cartItemListQuerySchema.parse(
      req.query || {}
    ) as CartItemListQuery;

    const sortKey: SortKey =
      q.sort === "updated_at" ? "updated_at" : "created_at";
    const dir: "asc" | "desc" = q.order === "asc" ? "asc" : "desc";

    let qb = db
      .select({ cart: cartItems, prod: products, cat: categories })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.product_id, products.id))
      .leftJoin(categories, eq(products.category_id, categories.id))
      .$dynamic();

    const conds: unknown[] = [];
    if (q.id) conds.push(eq(cartItems.id, q.id));
    if (q.user_id) conds.push(eq(cartItems.user_id, q.user_id));
    if (q.product_id) conds.push(eq(cartItems.product_id, q.product_id));

    if (conds.length === 1) qb = qb.where(conds[0] as any);
    else if (conds.length > 1) qb = qb.where(and(...(conds as any)));

    const orderExpr =
      dir === "asc"
        ? asc((cartItems as any)[sortKey])
        : desc((cartItems as any)[sortKey]);
    qb = qb.orderBy(orderExpr);

    if (q.limit && q.limit > 0) qb = qb.limit(q.limit);
    if (q.offset && q.offset >= 0) qb = qb.offset(q.offset);

    const rows = await qb;
    return reply.send(rows.map(mapRow));
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** GET /cart_items/:id */
export const getCartItemById: RouteHandler = async (req, reply) => {
  const { id } = (req.params || {}) as { id?: string };
  if (!id) {
    return reply.code(400).send({ error: { message: "id_required" } });
  }

  const rows = await db
    .select({ cart: cartItems, prod: products, cat: categories })
    .from(cartItems)
    .leftJoin(products, eq(cartItems.product_id, products.id))
    .leftJoin(categories, eq(products.category_id, categories.id))
    .where(eq(cartItems.id, id))
    .limit(1);

  if (!rows.length) {
    return reply.code(404).send({ error: { message: "not_found" } });
  }
  return reply.send(mapRow(rows[0]!));
};

/** POST /cart_items */
export const createCartItem: RouteHandler = async (req, reply) => {
  try {
    const body = cartItemCreateSchema.parse(
      req.body || {}
    ) as CartItemCreateInput;

    const now = new Date();
    const id = randomUUID();
    const toInsert: CartItemInsert = {
      id,
      user_id: body.user_id,
      product_id: body.product_id,
      quantity: body.quantity,
      options: body.selected_options
        ? JSON.stringify(body.selected_options)
        : body.options
        ? JSON.stringify(body.options)
        : null,
      created_at: now,
      updated_at: now,
    };

    await db.insert(cartItems).values(toInsert);

    const [row] = await db
      .select({ cart: cartItems, prod: products, cat: categories })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.product_id, products.id))
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(eq(cartItems.id, id))
      .limit(1);

    return reply.code(201).send(mapRow(row));
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** PATCH /cart_items/:id */
export const updateCartItem: RouteHandler = async (req, reply) => {
  try {
    const { id } = (req.params || {}) as { id?: string };
    if (!id) {
      return reply.code(400).send({ error: { message: "id_required" } });
    }

    const patch = cartItemUpdateSchema.parse(
      req.body || {}
    ) as CartItemUpdateInput;
    const now = new Date();

    const set: Partial<CartItemInsert> = { updated_at: now };
    if (patch.quantity != null) set.quantity = patch.quantity;

    if (patch.selected_options !== undefined) {
      set.options = patch.selected_options
        ? JSON.stringify(patch.selected_options)
        : null;
    } else if (patch.options !== undefined) {
      set.options = patch.options ? JSON.stringify(patch.options) : null;
    }

    await db.update(cartItems).set(set).where(eq(cartItems.id, id));

    const [row] = await db
      .select({ cart: cartItems, prod: products, cat: categories })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.product_id, products.id))
      .leftJoin(categories, eq(products.category_id, categories.id))
      .where(eq(cartItems.id, id))
      .limit(1);

    if (!row) {
      return reply.code(404).send({ error: { message: "not_found" } });
    }
    return reply.send(mapRow(row));
  } catch (e) {
    (req as any).log?.error?.(e);
    return reply.code(400).send({ error: { message: "validation_error" } });
  }
};

/** DELETE /cart_items/:id */
export const deleteCartItem: RouteHandler = async (req, reply) => {
  const { id } = (req.params || {}) as { id?: string };
  if (!id) {
    return reply.code(400).send({ error: { message: "id_required" } });
  }

  await db.delete(cartItems).where(eq(cartItems.id, id));
  return reply.code(204).send();
};
