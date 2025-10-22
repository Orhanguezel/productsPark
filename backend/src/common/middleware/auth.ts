import type { FastifyRequest, FastifyReply } from 'fastify';
import '@fastify/jwt'; 

export async function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  try {
    // fastify-jwt: verify + req.user set
    await req.jwtVerify();
  } catch (err: any) {
    req.log.warn(err);
    // header yoksa özel mesaj, aksi halde invalid
    const msg =
      err?.message?.includes('No Authorization was found') ? 'no_token' : 'invalid_token';
    return reply.code(401).send({ error: { message: msg } });
  }
}
