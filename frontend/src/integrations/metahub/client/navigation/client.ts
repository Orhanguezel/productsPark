
// =============================================================
// FILE: src/integrations/metahub/client/navigation/client.ts (menu + footer + pages + popups + email)
// =============================================================
import { store as store_n } from "@/store";
import { normalizeError as nErr_n } from "@/integrations/metahub/core/errors";
import { menuItemsApi, type MenuItem } from "@/integrations/metahub/rtk/endpoints/menu_items.endpoints";
import { footerSectionsApi, type FooterSection } from "@/integrations/metahub/rtk/endpoints/footer_sections.endpoints";
import { customPagesApi, type CustomPage } from "@/integrations/metahub/rtk/endpoints/custom_pages.endpoints";
import { popupsApi, type Popup } from "@/integrations/metahub/rtk/endpoints/popups.endpoints";
import { emailTemplatesApi, type EmailTemplate } from "@/integrations/metahub/rtk/endpoints/email_templates.endpoints";

export type { MenuItem, FooterSection, CustomPage, Popup, EmailTemplate };

export const navigation = {
  async menu(params?: Parameters<typeof menuItemsApi.endpoints.listMenuItems.initiate>[0]) {
    try { const data = await store_n.dispatch(menuItemsApi.endpoints.listMenuItems.initiate(params ?? {})).unwrap(); return { data: data as MenuItem[], error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as MenuItem[] | null, error: { message } }; }
  },
  async footer(params?: Parameters<typeof footerSectionsApi.endpoints.listFooterSections.initiate>[0]) {
    try { const data = await store_n.dispatch(footerSectionsApi.endpoints.listFooterSections.initiate(params ?? {})).unwrap(); return { data: data as FooterSection[], error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as FooterSection[] | null, error: { message } }; }
  },
  async pages(params?: Parameters<typeof customPagesApi.endpoints.listCustomPages.initiate>[0]) {
    try { const data = await store_n.dispatch(customPagesApi.endpoints.listCustomPages.initiate(params ?? {})).unwrap(); return { data: data as CustomPage[], error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as CustomPage[] | null, error: { message } }; }
  },
  async pageBySlug(slug: string, locale?: string) {
    try { const data = await store_n.dispatch(customPagesApi.endpoints.getCustomPageBySlug.initiate({ slug, locale })).unwrap(); return { data: data as CustomPage, error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as CustomPage | null, error: { message } }; }
  },
  async popups(params?: Parameters<typeof popupsApi.endpoints.listPopups.initiate>[0]) {
    try { const data = await store_n.dispatch(popupsApi.endpoints.listPopups.initiate(params ?? {})).unwrap(); return { data: data as Popup[], error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as Popup[] | null, error: { message } }; }
  },
  async popupByKey(key: string, locale?: string) {
    try { const data = await store_n.dispatch(popupsApi.endpoints.getPopupByKey.initiate({ key, locale })).unwrap(); return { data: data as Popup, error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as Popup | null, error: { message } }; }
  },
  async emailTemplates(params?: Parameters<typeof emailTemplatesApi.endpoints.listEmailTemplates.initiate>[0]) {
    try { const data = await store_n.dispatch(emailTemplatesApi.endpoints.listEmailTemplates.initiate(params ?? {})).unwrap(); return { data: data as EmailTemplate[], error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as EmailTemplate[] | null, error: { message } }; }
  },
  async emailTemplateByKey(key: string, locale?: string) {
    try { const data = await store_n.dispatch(emailTemplatesApi.endpoints.getEmailTemplateByKey.initiate({ key, locale })).unwrap(); return { data: data as EmailTemplate, error: null as null }; }
    catch (e) { const { message } = nErr_n(e); return { data: null as EmailTemplate | null, error: { message } }; }
  },
};