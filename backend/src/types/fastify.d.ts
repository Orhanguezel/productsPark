// =============================================================
// FILE: src/types/fastify.d.ts
// FINAL — FastifyContextConfig augmentation (public/auth/rateLimit)
// Fixes TS2353 for: config.public, config.auth, config.rateLimit
// =============================================================

import 'fastify';

declare module 'fastify' {
  interface FastifyContextConfig {
    /** public route flag (custom) */
    public?: boolean;

    /** auth required flag (custom) */
    auth?: boolean;

    /** optional rate limit config (if you later register @fastify/rate-limit) */
    rateLimit?: {
      max: number;
      timeWindow: string;
    };
  }
}
