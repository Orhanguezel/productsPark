// src/modules/cart/routes.ts
import type { FastifyInstance } from "fastify";
import {
  listCartItems,
  getCartItemById,
  createCartItem,
  updateCartItem,
  deleteCartItem,
} from "./controller";

const BASE_PATH = "/cart_items";

export async function registerCartItems(app: FastifyInstance) {
  app.get(`${BASE_PATH}`, listCartItems);          // ?user_id=... ile liste
  app.get(`${BASE_PATH}/:id`, getCartItemById);    // tekil item

  app.post(`${BASE_PATH}`, createCartItem);        // yeni item

  app.patch(`${BASE_PATH}/:id`, updateCartItem);   // güncelle
  app.delete(`${BASE_PATH}/:id`, deleteCartItem);  // sil
}
