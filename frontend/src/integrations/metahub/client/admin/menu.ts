// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/menu.ts
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  menuAdminApi,
  type MenuItemAdmin,
  type MenuAdminListParams,
  type UpsertMenuItemBody,
} from "@/integrations/metahub/rtk/endpoints/admin/menu_admin.endpoints";
import {
  footerSectionsAdminApi,
  type FooterSection,
  type FooterSectionListParams,
  type UpsertFooterSectionBody,
} from "@/integrations/metahub/rtk/endpoints/admin/footer_sections_admin.endpoints";

export const menuAdmin = {
  async list(params?: Partial<MenuAdminListParams>) {
    try {
      const data = await store.dispatch(menuAdminApi.endpoints.listMenuItemsAdmin.initiate(params)).unwrap();
      return { data: data as MenuItemAdmin[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as MenuItemAdmin[] | null, error: { message } };
    }
  },
  async getById(id: string) {
    try {
      const data = await store.dispatch(menuAdminApi.endpoints.getMenuItemAdminById.initiate(id)).unwrap();
      return { data: data as MenuItemAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as MenuItemAdmin | null, error: { message } };
    }
  },
  async create(body: UpsertMenuItemBody) {
    try {
      const data = await store.dispatch(menuAdminApi.endpoints.createMenuItemAdmin.initiate(body)).unwrap();
      return { data: data as MenuItemAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as MenuItemAdmin | null, error: { message } };
    }
  },
  async update(id: string, body: UpsertMenuItemBody) {
    try {
      const data = await store.dispatch(menuAdminApi.endpoints.updateMenuItemAdmin.initiate({ id, body })).unwrap();
      return { data: data as MenuItemAdmin, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as MenuItemAdmin | null, error: { message } };
    }
  },
  async remove(id: string) {
    try {
      await store.dispatch(menuAdminApi.endpoints.deleteMenuItemAdmin.initiate(id)).unwrap();
      return { ok: true as const, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { ok: false as const, error: { message } };
    }
  },
  async reorder(items: Array<{ id: string; display_order: number }>) {
    try {
      await store.dispatch(menuAdminApi.endpoints.reorderMenuItemsAdmin.initiate(items)).unwrap();
      return { ok: true as const, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { ok: false as const, error: { message } };
    }
  },
};

export const footerSectionsAdmin = {
  async list(params?: Partial<FooterSectionListParams>) {
    try {
      const data = await store.dispatch(footerSectionsAdminApi.endpoints.listFooterSectionsAdmin.initiate(params)).unwrap();
      return { data: data as FooterSection[], error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as FooterSection[] | null, error: { message } };
    }
  },
  async getById(id: string) {
    try {
      const data = await store.dispatch(footerSectionsAdminApi.endpoints.getFooterSectionAdminById.initiate(id)).unwrap();
      return { data: data as FooterSection, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as FooterSection | null, error: { message } };
    }
  },
  async create(body: UpsertFooterSectionBody) {
    try {
      const data = await store.dispatch(footerSectionsAdminApi.endpoints.createFooterSectionAdmin.initiate(body)).unwrap();
      return { data: data as FooterSection, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as FooterSection | null, error: { message } };
    }
  },
  async update(id: string, body: UpsertFooterSectionBody) {
    try {
      const data = await store.dispatch(footerSectionsAdminApi.endpoints.updateFooterSectionAdmin.initiate({ id, body })).unwrap();
      return { data: data as FooterSection, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { data: null as FooterSection | null, error: { message } };
    }
  },
  async remove(id: string) {
    try {
      await store.dispatch(footerSectionsAdminApi.endpoints.deleteFooterSectionAdmin.initiate(id)).unwrap();
      return { ok: true as const, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { ok: false as const, error: { message } };
    }
  },
  async reorder(items: Array<{ id: string; display_order: number }>) {
    try {
      await store.dispatch(footerSectionsAdminApi.endpoints.reorderFooterSectionsAdmin.initiate(items)).unwrap();
      return { ok: true as const, error: null as null };
    } catch (e) {
      const { message } = normalizeError(e);
      return { ok: false as const, error: { message } };
    }
  },
};
