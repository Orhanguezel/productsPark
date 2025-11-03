// src/types/fastify-mysql.d.ts
import "fastify";

type MySQL = { query<T = unknown[]>(sql: string, params?: unknown[]): Promise<[T, unknown]> };

declare module "fastify" {
  interface FastifyInstance {
    mysql?: MySQL;
    db?: MySQL;
    mariadb?: MySQL;
  }
  interface FastifyRequest {
    mysql?: MySQL;
  }
}