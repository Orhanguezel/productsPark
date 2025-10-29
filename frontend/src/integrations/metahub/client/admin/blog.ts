// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/blog.ts
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  blogAdminApi,
  type BlogPost,
  type ListParams,
  type UpsertBlogBody,
} from "@/integrations/metahub/rtk/endpoints/admin/blog_admin.endpoints";

export const blogAdmin = {
  async list(params?: ListParams) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.listBlogPostsAdmin.initiate(params))
        .unwrap();
      return { data: data as BlogPost[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as BlogPost[] | null, error: { message } };
    }
  },

  async getById(id: string) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.getBlogPostAdminById.initiate(id))
        .unwrap();
      return { data: data as BlogPost, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },

  async getBySlug(slug: string) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.getBlogPostAdminBySlug.initiate(slug))
        .unwrap();
      return { data: (data ?? null) as BlogPost | null, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },

  async create(body: UpsertBlogBody) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.createBlogPostAdmin.initiate(body))
        .unwrap();
      return { data: data as BlogPost, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },

  async update(id: string, body: UpsertBlogBody) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.updateBlogPostAdmin.initiate({ id, body }))
        .unwrap();
      return { data: data as BlogPost, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },

  async remove(id: string) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.deleteBlogPostAdmin.initiate(id))
        .unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as { ok: true } | null, error: { message } };
    }
  },

  async reorder(items: Array<{ id: string; display_order: number }>) {
    try {
      const data = await store
        .dispatch(blogAdminApi.endpoints.reorderBlogPostsAdmin.initiate(items))
        .unwrap();
      return { data, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as { ok: true } | null, error: { message } };
    }
  },

  async setPublished(id: string, is_published: boolean) {
    try {
      const data = await store
        .dispatch(
          blogAdminApi.endpoints.togglePublishBlogPostAdmin.initiate({ id, is_published })
        )
        .unwrap();
      return { data: data as BlogPost, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as BlogPost | null, error: { message } };
    }
  },
};

export type { BlogPost, ListParams, UpsertBlogBody };
