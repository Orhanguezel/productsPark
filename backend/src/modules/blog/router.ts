import type { FastifyInstance } from 'fastify';
import {
  listPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
  publishPost,
  unpublishPost,
  restorePost,
  listRevisions,
  getRevision,
  revertToRevision,
} from './controller';

// İstersen admin koruması ekle:
// import { requireAuth } from '@/common/middleware/auth';

export async function registerBlog(app: FastifyInstance) {
  // list & get
  app.get('/blog_posts', /*{ preHandler: [requireAuth] },*/ listPosts);
  app.get('/blog_posts/:id', /*{ preHandler: [requireAuth] },*/ getPost);
  app.get('/blog_posts/slug/:slug', /* public */ getPostBySlug);

  // crud
  app.post('/blog_posts', /*{ preHandler: [requireAuth] },*/ createPost);
  app.patch('/blog_posts/:id', /*{ preHandler: [requireAuth] },*/ updatePost);

  // soft delete / restore
  app.delete('/blog_posts/:id', /*{ preHandler: [requireAuth] },*/ deletePost);
  app.post('/blog_posts/:id/restore', /*{ preHandler: [requireAuth] },*/ restorePost);

  // publish ops
  app.post('/blog_posts/:id/publish', /*{ preHandler: [requireAuth] },*/ publishPost);
  app.post('/blog_posts/:id/unpublish', /*{ preHandler: [requireAuth] },*/ unpublishPost);

  // revisions
  app.get('/blog_posts/:id/revisions', /*{ preHandler: [requireAuth] },*/ listRevisions);
  app.get('/blog_posts/:id/revisions/:revNo', /*{ preHandler: [requireAuth] },*/ getRevision);
  app.post('/blog_posts/:id/revisions/:revNo/revert', /*{ preHandler: [requireAuth] },*/ revertToRevision);
}
