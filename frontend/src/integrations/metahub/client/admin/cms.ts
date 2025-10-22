
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/cms.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  cmsAdminApi,
  type Page, type PageListParams, type CreatePageBody, type UpdatePageBody, type ExportResponse,
  type Block, type BlockListParams, type CreateBlockBody, type UpdateBlockBody,
  type Menu, type CreateMenuBody, type UpdateMenuBody, type MenuItem,
  type Redirect, type RedirectListParams, type CreateRedirectBody, type UpdateRedirectBody, type ImportRedirectItem,
} from "@/integrations/metahub/rtk/endpoints/admin/cms_admin.endpoints";

export const cmsAdmin = {
  // Pages
  async pages(params?: PageListParams) { try { const d = await store.dispatch(cmsAdminApi.endpoints.listPagesAdmin.initiate(params)).unwrap(); return { data: d as Page[], error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page[] | null, error: { message } }; } },
  async page(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.getPageAdminById.initiate(id)).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async pageBySlug(slug: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.getPageAdminBySlug.initiate(slug)).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async createPage(body: CreatePageBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.createPageAdmin.initiate(body)).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async updatePage(id: string, body: UpdatePageBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.updatePageAdmin.initiate({ id, body })).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async deletePage(id: string) { try { await store.dispatch(cmsAdminApi.endpoints.deletePageAdmin.initiate(id)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; } },
  async publishPage(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.publishPageAdmin.initiate(id)).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async unpublishPage(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.unpublishPageAdmin.initiate(id)).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async duplicatePage(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.duplicatePageAdmin.initiate(id)).unwrap(); return { data: d as Page, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Page | null, error: { message } }; } },
  async exportPages(params?: PageListParams) { try { const d = await store.dispatch(cmsAdminApi.endpoints.exportPagesAdmin.initiate(params)).unwrap(); return { data: d as ExportResponse, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; } },

  // Blocks
  async blocks(params?: BlockListParams) { try { const d = await store.dispatch(cmsAdminApi.endpoints.listBlocksAdmin.initiate(params)).unwrap(); return { data: d as Block[], error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Block[] | null, error: { message } }; } },
  async block(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.getBlockAdminById.initiate(id)).unwrap(); return { data: d as Block, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Block | null, error: { message } }; } },
  async createBlock(body: CreateBlockBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.createBlockAdmin.initiate(body)).unwrap(); return { data: d as Block, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Block | null, error: { message } }; } },
  async updateBlock(id: string, body: UpdateBlockBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.updateBlockAdmin.initiate({ id, body })).unwrap(); return { data: d as Block, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Block | null, error: { message } }; } },
  async deleteBlock(id: string) { try { await store.dispatch(cmsAdminApi.endpoints.deleteBlockAdmin.initiate(id)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; } },

  // Menus
  async menus(params?: { q?: string }) { try { const d = await store.dispatch(cmsAdminApi.endpoints.listMenusAdmin.initiate(params)).unwrap(); return { data: d as Menu[], error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Menu[] | null, error: { message } }; } },
  async menu(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.getMenuAdminById.initiate(id)).unwrap(); return { data: d as Menu, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Menu | null, error: { message } }; } },
  async createMenu(body: CreateMenuBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.createMenuAdmin.initiate(body)).unwrap(); return { data: d as Menu, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Menu | null, error: { message } }; } },
  async updateMenu(id: string, body: UpdateMenuBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.updateMenuAdmin.initiate({ id, body })).unwrap(); return { data: d as Menu, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Menu | null, error: { message } }; } },
  async updateMenuItems(id: string, items: MenuItem[]) { try { const d = await store.dispatch(cmsAdminApi.endpoints.updateMenuItemsAdmin.initiate({ id, items })).unwrap(); return { data: d as Menu, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Menu | null, error: { message } }; } },
  async deleteMenu(id: string) { try { await store.dispatch(cmsAdminApi.endpoints.deleteMenuAdmin.initiate(id)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; } },

  // Redirects
  async redirects(params?: RedirectListParams) { try { const d = await store.dispatch(cmsAdminApi.endpoints.listRedirectsAdmin.initiate(params)).unwrap(); return { data: d as Redirect[], error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Redirect[] | null, error: { message } }; } },
  async redirect(id: string) { try { const d = await store.dispatch(cmsAdminApi.endpoints.getRedirectAdminById.initiate(id)).unwrap(); return { data: d as Redirect, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Redirect | null, error: { message } }; } },
  async createRedirect(body: CreateRedirectBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.createRedirectAdmin.initiate(body)).unwrap(); return { data: d as Redirect, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Redirect | null, error: { message } }; } },
  async updateRedirect(id: string, body: UpdateRedirectBody) { try { const d = await store.dispatch(cmsAdminApi.endpoints.updateRedirectAdmin.initiate({ id, body })).unwrap(); return { data: d as Redirect, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as Redirect | null, error: { message } }; } },
  async deleteRedirect(id: string) { try { await store.dispatch(cmsAdminApi.endpoints.deleteRedirectAdmin.initiate(id)).unwrap(); return { ok: true as const }; } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; } },
  async importRedirects(body: { items: ImportRedirectItem[] } | { csv: string }) { try { const d = await store.dispatch(cmsAdminApi.endpoints.importRedirectsAdmin.initiate(body)).unwrap(); return { data: d as { imported: number }, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as { imported: number } | null, error: { message } }; } },
  async exportRedirects(params?: RedirectListParams) { try { const d = await store.dispatch(cmsAdminApi.endpoints.exportRedirectsAdmin.initiate(params)).unwrap(); return { data: d as ExportResponse, error: null as null }; } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; } },
};

export type { Page, PageListParams, CreatePageBody, UpdatePageBody, ExportResponse, Block, BlockListParams, CreateBlockBody, UpdateBlockBody, Menu, MenuItem, CreateMenuBody, UpdateMenuBody, Redirect, RedirectListParams, CreateRedirectBody, UpdateRedirectBody, ImportRedirectItem };
