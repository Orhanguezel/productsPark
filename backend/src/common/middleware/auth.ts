import type { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/jwt';
import '@fastify/cookie';

/**
 * Cookie-first + Header fallback.
 * - Cookie adları: access_token | accessToken
 * - Header: Authorization: Bearer <token>
 */
export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const hasAuthHeader = typeof req.headers.authorization === 'string' && req.headers.authorization.length > 0;
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const cookieToken = cookies.access_token ?? cookies.accessToken;

    if (cookieToken) {
      const payload = req.server.jwt.verify(cookieToken);
      (req as any).user = payload;
      return;
    }

    if (hasAuthHeader) {
      // fastify-jwt: req.jwtVerify() -> payload'ı req.user içine yazar
      await req.jwtVerify();
      // güvene almak için:
      if (!(req as any).user && (req as any).user === undefined) {
        (req as any).user = (req as any).user ?? (req as any).jwt ?? undefined;
      }
      return;
    }

    reply.code(401).send({ error: { message: 'no_token' } });
    return;
  } catch (err) {
    req.log.warn({ err }, 'auth_failed');
    reply.code(401).send({ error: { message: 'invalid_token' } });
    return;
  }
}
