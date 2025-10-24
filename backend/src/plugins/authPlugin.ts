// src/plugins/authPlugin.ts
import fp from "fastify-plugin";
import type { FastifyPluginAsync } from "fastify";

const authPlugin: FastifyPluginAsync = async (app) => {
  app.addHook("onRequest", async (req, reply) => {
    if (req.method === "OPTIONS") return;

    const isPublic = (req.routeOptions?.config as any)?.public === true;
    if (isPublic) return;

    // Hem header hem cookie’den destekle
    const hasAuthHeader = typeof req.headers.authorization === "string";
    const hasCookie = Boolean(req.cookies?.access_token);

    if (!hasAuthHeader && !hasCookie) {
      return reply.code(401).send({ error: { message: "no_token" } });
    }

    try {
      // fastify-jwt cookie ile kurulduğu için jwtVerify cookie'den de okuyabilir
      await req.jwtVerify();
    } catch {
      return reply.code(401).send({ error: { message: "invalid_token" } });
    }
  });
};

export default fp(authPlugin);
