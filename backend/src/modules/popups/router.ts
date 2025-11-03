import type { FastifyInstance } from "fastify";
import { listPopups, getPopupByKey } from "./controller";

export async function registerPopups(app: FastifyInstance) {
  app.get("/popups", listPopups);
  app.get("/popups/by-key/:key", getPopupByKey);
}
