// =============================================================
// FILE: src/modules/products/admin.options.controller.ts
// =============================================================
import type { RouteHandler } from "fastify";
import { db } from "@/db/client";
import { asc, eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";
import { products, productOptions } from "./schema";
import {
  productOptionCreateSchema,
  productOptionUpdateSchema,
} from "./validation";

import { now} from '@/modules/_shared/common';

/* LIST */
export const adminListProductOptions: RouteHandler = async (req, reply) => {
  const { id } = req.params as { id: string };
  const rows = await db
    .select()
    .from(productOptions)
    .where(eq(productOptions.product_id, id))
    .orderBy(asc(productOptions.created_at));
  return reply.send(rows);
};

/* CREATE */
export const adminCreateProductOption: RouteHandler = async (req, reply) => {
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

    const body = productOptionCreateSchema.parse({
      ...(req.body || {}),
      product_id: id,
    });

    const row: any = {
      ...body,
      id: body.id ?? randomUUID(),
      created_at: now(),
      updated_at: now(),
    };

    await db.insert(productOptions).values(row);
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
export const adminUpdateProductOption: RouteHandler = async (req, reply) => {
  const { id, optionId } = req.params as { id: string; optionId: string };
  try {
    const patch = productOptionUpdateSchema.parse({
      ...(req.body || {}),
      product_id: id,
    });

    await db
      .update(productOptions)
      .set({ ...patch, updated_at: now() } as any)
      .where(
        and(
          eq(productOptions.id, optionId),
          eq(productOptions.product_id, id)
        )
      );

    const [row] = await db
      .select()
      .from(productOptions)
      .where(eq(productOptions.id, optionId))
      .limit(1);

    if (!row)
      return reply.code(404).send({ error: { message: "not_found" } });

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

/* DELETE */
export const adminDeleteProductOption: RouteHandler = async (req, reply) => {
  const { id, optionId } = req.params as { id: string; optionId: string };
  await db
    .delete(productOptions)
    .where(
      and(
        eq(productOptions.id, optionId),
        eq(productOptions.product_id, id)
      )
    );
  return reply.send({ ok: true });
};
