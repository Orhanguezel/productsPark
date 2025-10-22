import type { FastifyInstance } from 'fastify';
import {
  listEmailTemplates,
  getEmailTemplate,
  getEmailTemplateByName,
  createEmailTemplate,
  updateEmailTemplate,
  deleteEmailTemplate,
  renderById,
  renderByName,
} from './controller';
// Eğer yönetici koruması istiyorsan buraya requireAuth ekleyebilirsin.
// import { requireAuth } from '@/common/middleware/auth';

export async function registerEmailTemplates(app: FastifyInstance) {
  // CRUD
  app.get('/email_templates', /*{ preHandler: [requireAuth] },*/ listEmailTemplates);
  app.get('/email_templates/:id', /*{ preHandler: [requireAuth] },*/ getEmailTemplate);
  app.get('/email_templates/name/:name', /*{ preHandler: [requireAuth] },*/ getEmailTemplateByName);
  app.post('/email_templates', /*{ preHandler: [requireAuth] },*/ createEmailTemplate);
  app.patch('/email_templates/:id', /*{ preHandler: [requireAuth] },*/ updateEmailTemplate);
  app.delete('/email_templates/:id', /*{ preHandler: [requireAuth] },*/ deleteEmailTemplate);

  // Render
  app.post('/email_templates/:id/render', /*{ preHandler: [requireAuth] },*/ renderById);
  app.post('/email_templates/name/:name/render', /*{ preHandler: [requireAuth] },*/ renderByName);
}
