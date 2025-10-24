// src/modules/support/router.ts
import { FastifyInstance } from "fastify";
import { SupportController } from "./controller";

export async function registerSupport(app: FastifyInstance) {
  // LIST — public
  app.route({
    method: "GET",
    url: "/support_tickets",
    config: { public: true },
    handler: SupportController.listTickets,
  });

  // GET by id — public
  app.route({
    method: "GET",
    url: "/support_tickets/:id",
    config: { public: true },
    handler: SupportController.getTicket,
  });

  // CREATE ticket — protected
  app.route({
    method: "POST",
    url: "/support_tickets",
    // config.public yok → authPlugin token arar
    handler: SupportController.createTicket,
  });

  // UPDATE ticket — protected (RBAC kontrolü controller içinde)
  app.route({
    method: "PATCH",
    url: "/support_tickets/:id",
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
