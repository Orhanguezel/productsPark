// modules/topbar/router.ts (public)
import type { FastifyInstance } from "fastify";
import {
  listTopbarSettings,
  getTopbarSettingById,
} from "./controller";
import type { TopbarPublicListQuery } from "./validation";

const BASE="/topbar_settings";

export async function registerTopbar(app: FastifyInstance) {
  app.get<{ Querystring: TopbarPublicListQuery }>(
    BASE,
    listTopbarSettings,
  );
  app.get<{ Params: { id: string } }>(
    `${BASE}/:id`,
    getTopbarSettingById,
  );
}
