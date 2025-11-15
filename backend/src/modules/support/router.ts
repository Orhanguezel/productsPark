// src/modules/support/router.ts

import type { FastifyInstance } from "fastify";
import { SupportController } from "./controller";

const BASE="/support_tickets";

export async function registerSupport(app: FastifyInstance) {
  // LIST — public
  app.route({
    method: "GET",
    url: `${BASE}`,
    config: { public: true },
    handler: SupportController.listTickets,
  });

  // GET by id — public
  app.route({
    method: "GET",
    url: `${BASE}/:id`,
    config: { public: true },
    handler: SupportController.getTicket,
  });

  // CREATE ticket — protected (config.public yok → auth plugin devreye girer)
  app.route({
    method: "POST",
    url: `${BASE}`,
    handler: SupportController.createTicket,
  });

  // UPDATE ticket — protected (RBAC kontrolü controller içinde)
  app.route({
    method: "PATCH",
    url: `${BASE}/:id`,
    handler: SupportController.updateTicket,
  });

  // LIST replies by ticket — public
  app.route({
    method: "GET",
    url: "/ticket_replies/by-ticket/:ticketId",
    config: { public: true },
    handler: SupportController.listRepliesByTicket,
  });

  // CREATE reply — protected
  app.route({
    method: "POST",
    url: "/ticket_replies",
    handler: SupportController.createReply,
  });
}
