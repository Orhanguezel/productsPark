// src/modules/cart/routes.ts
import type { FastifyInstance } from "fastify";
import {
  listCartItems,
  getCartItemById,
  createCartItem,
  updateCartItem,
  deleteCartItem,
} from "./controller";

export async function registerCartItems(app: FastifyInstance) {
  app.get("/cart_items", listCartItems);
  app.get("/cart_items/:id", getCartItemById);

  // auth gerekiyorsa middleware eklenebilir
  app.post("/cart_items", /* { preHandler: [requireAuth] }, */ createCartItem);
  app.patch("/cart_items/:id", /* { preHandler: [requireAuth] }, */ updateCartItem);
  app.delete("/cart_items/:id", /* { preHandler: [requireAuth] }, */ deleteCartItem);
}
