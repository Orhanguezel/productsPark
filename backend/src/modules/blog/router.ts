import type { FastifyInstance } from 'fastify';
import {
  listPosts,
  getPost,
  getPostBySlug,
  createPost,
  updatePost,
  deletePost,
} from './controller';

const BASE='/blog_posts';

export async function registerBlog(app: FastifyInstance) {
  app.get(`${BASE}`, listPosts);
  app.get(`${BASE}/:id`, getPost);
  app.get(`${BASE}/by-slug/:slug`, getPostBySlug);

  app.post(`${BASE}`, createPost);
  app.patch(`${BASE}/:id`, updatePost);
  app.delete(`${BASE}/:id`, deletePost);
}
