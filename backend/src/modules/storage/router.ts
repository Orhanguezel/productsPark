// src/modules/storage/router.ts
import type { FastifyInstance } from "fastify";
import { requireAuth } from "@/common/middleware/auth";
import { publicServe, uploadToBucket, signPut, signMultipart } from "./controller";
import type { SignPutBody, SignMultipartBody } from "./validation";

export async function registerStorage(app: FastifyInstance) {
  // GET -> Fastify otomatik HEAD route'u da ekler (ayrıca tanımlamaya gerek yok)
  app.get<{ Params: { bucket: string; "*": string } }>(
    "/storage/:bucket/*",
    { config: { public: true } },
    publicServe
  );

  app.post<{ Params: { bucket: string }; Querystring: { path?: string; upsert?: string } }>(
    "/storage/:bucket/upload",
    { preHandler: [requireAuth] },
    uploadToBucket
  );

  app.post<{ Body: SignPutBody }>(
    "/storage/uploads/sign-put",
    { preHandler: [requireAuth] },
    signPut
  );

  app.post<{ Body: SignMultipartBody }>(
    "/storage/uploads/sign-multipart",
    { preHandler: [requireAuth] },
    signMultipart
  );
}
