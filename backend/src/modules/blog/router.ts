// src/modules/blog/router.ts
import type { FastifyInstance } from 'fastify';
import {
  listPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from './controller';

export async function registerBlog(app: FastifyInstance) {
  app.get('/blog_posts', listPosts);
  app.get('/blog_posts/:id', getPost);
  app.get('/blog_posts/by-slug/:slug', getPostBySlug); // ← DÜZELTİLDİ

  app.post('/blog_posts', createPost);
  app.patch('/blog_posts/:id', updatePost);
  app.delete('/blog_posts/:id', deletePost);

  // publish/unpublish/revisions uçlarını şimdilik kaldırdık;
  // ileride şema eklenince tekrar ekleyebilirsin.
}
