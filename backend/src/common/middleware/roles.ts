import type { FastifyReply, FastifyRequest } from 'fastify';

/** Basit rol kontrolü; JWT payload içindeki `role` alanını bekler. */
export async function requireAdmin(req: FastifyRequest, reply: FastifyReply) {
  const role = (req as any)?.user?.role;
  if (role === 'admin') return;
  reply.code(403).send({ error: { message: 'forbidden' } });
  return;
}
