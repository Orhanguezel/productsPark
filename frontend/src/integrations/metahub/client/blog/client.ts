// =============================================================
// FILE: src/integrations/metahub/client/blog/client.ts
// =============================================================
import { store as store4 } from "@/store";
import { normalizeError as normalizeError4 } from "@/integrations/metahub/core/errors";
import { blogPostsApi, type BlogPost } from "@/integrations/metahub/rtk/endpoints/blog_posts.endpoints";

export type { BlogPost };

export const blog = {
  async list(params?: Parameters<typeof blogPostsApi.endpoints.listBlogPosts.initiate>[0]) {
    try {
      const data = await store4.dispatch(
        blogPostsApi.endpoints.listBlogPosts.initiate(params ?? {})
      ).unwrap();
      return { data: data as BlogPost[], error: null as null };
    } catch (e) {
      const { message } = normalizeError4(e);
      return { data: null as BlogPost[] | null, error: { message } };
    }
  },

  async getBySlug(slug: string) {
    try {
      const data = await store4.dispatch(
        blogPostsApi.endpoints.getBlogPostBySlug.initiate(slug)
      ).unwrap();
      return { data: data as BlogPost | null, error: null as null };
    } catch (e) {
      const { message } = normalizeError4(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store4.dispatch(
        blogPostsApi.endpoints.getBlogPostById.initiate(id)
      ).unwrap();
      return { data: data as BlogPost, error: null as null };
    } catch (e) {
      const { message } = normalizeError4(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },
};
