// =============================================================
// FILE: src/modules/contact/admin.controller.ts
// =============================================================
import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { ContactListParamsSchema, ContactUpdateSchema } from "./validation";
import {
  repoListContacts,
  repoGetContactById,
  repoUpdateContact,
  repoDeleteContact,
  repoCountContacts,
} from "./repository";

export function makeAdminController(app: FastifyInstance) {
  return {
    // GET /admin/contacts
    list: async (
      req: FastifyRequest<{ Querystring: Record<string, any> }>,
      reply: FastifyReply
    ): Promise<void> => {
      const parsed = ContactListParamsSchema.safeParse(req.query);
      if (!parsed.success) {
        reply.code(400).send({ error: "INVALID_QUERY", details: parsed.error.flatten() });
        return;
      }

      const [items, total] = await Promise.all([
        repoListContacts(app, parsed.data),
        repoCountContacts(app, parsed.data),
      ]);

      reply.header("X-Total-Count", String(total));
      reply.send(items);
    },

    // GET /admin/contacts/:id
    get: async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ): Promise<void> => {
      const row = await repoGetContactById(app, req.params.id);
      if (!row) {
        reply.code(404).send({ error: "NOT_FOUND" });
        return;
      }
      reply.send(row);
    },

    // PATCH /admin/contacts/:id
    update: async (
      req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
      reply: FastifyReply
    ): Promise<void> => {
      const parsed = ContactUpdateSchema.safeParse(req.body);
      if (!parsed.success) {
        reply.code(400).send({ error: "INVALID_BODY", details: parsed.error.flatten() });
        return;
      }
      const updated = await repoUpdateContact(app, req.params.id, parsed.data);
      if (!updated) {
        reply.code(404).send({ error: "NOT_FOUND" });
        return;
      }
      reply.send(updated);
    },

    // DELETE /admin/contacts/:id
    remove: async (
      req: FastifyRequest<{ Params: { id: string } }>,
      reply: FastifyReply
    ): Promise<void> => {
      const ok = await repoDeleteContact(app, req.params.id);
      reply.send({ ok });
    },
  };
}
