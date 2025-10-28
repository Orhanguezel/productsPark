import 'fastify';
import type { MySQLPromisePool } from '@fastify/mysql';

declare module 'fastify' {
  interface FastifyInstance {
    /** Decorated by @fastify/mysql with { promise: true } */
    mysql: MySQLPromisePool;
  }
  interface FastifyRequest {
    /** Only if you ever attach it to req; optional */
    mysql?: MySQLPromisePool;
  }
}
