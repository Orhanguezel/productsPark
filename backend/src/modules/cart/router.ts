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
  // CORS preflight: PATCH/DELETE dahil
  app.options("/cart_items", async (_req, reply) => {
    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Allow-Headers", "content-type")
      .header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
      .code(204)
      .send();
  });
  app.options("/cart_items/:id", async (_req, reply) => {
    reply
      .header("Access-Control-Allow-Origin", "*")
      .header("Access-Control-Allow-Credentials", "true")
      .header("Access-Control-Allow-Headers", "content-type")
      .header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS")
      .code(204)
      .send();
  });

  app.get("/cart_items", listCartItems);
  app.get("/cart_items/:id", getCartItemById);

  app.post("/cart_items", createCartItem);

  // PATCH’i hem /:id hem de ?id=... olarak kabul et
  app.patch("/cart_items", updateCartItem);
  app.patch("/cart_items/:id", updateCartItem);

  // DELETE de benzer şekilde :id veya ?id=
  app.delete("/cart_items", deleteCartItem);
  app.delete("/cart_items/:id", deleteCartItem);
}
