import type { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/jwt';

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    const hasAuthHeader =
      typeof req.headers.authorization === 'string' && req.headers.authorization.length > 0;

    // her iki adı da tara
    const cookies = (req.cookies ?? {}) as Record<string, string | undefined>;
    const cookieToken = cookies.access_token ?? cookies.accessToken;

    if (hasAuthHeader) {
      // Authorization: Bearer ... (plugin kendi alır)
      await req.jwtVerify();
      return;
    }

    if (cookieToken) {
      // Cookie-first doğrulama (adı ne olursa olsun)
      const payload = req.server.jwt.verify(cookieToken);
      (req as any).user = payload; // fastify-jwt'nin yaptığı gibi request.user doldur
      return;
    }

    return reply.code(401).send({ error: { message: 'no_token' } });
  } catch (err) {
    req.log.warn(err);
    return reply.code(401).send({ error: { message: 'invalid_token' } });
  }
}
