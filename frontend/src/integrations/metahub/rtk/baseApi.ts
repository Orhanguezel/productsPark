import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "@/store";
import { store } from "@/store";
import { setSession, reset as resetSession } from "@/integrations/metahub/rtk/slices/auth/slice";

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? ""; // '/api' yok

// Tenancy (optional)
const ENABLE_TENANCY = import.meta.env.VITE_ENABLE_TENANCY === "1";
const TENANT_HEADER = (import.meta.env.VITE_TENANT_HEADER as string) || "x-tenant";

const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,                // boşsa relative origin kullanılır
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const s = (getState() as RootState).auth.session;
    if (s?.accessToken) headers.set("authorization", `Bearer ${s.accessToken}`);

    if (ENABLE_TENANCY) {
      const tenant = (getState() as RootState).auth.tenant || (import.meta.env.VITE_DEFAULT_TENANT as string | undefined);
      if (tenant) headers.set(TENANT_HEADER, tenant);
    }

    const locale = (getState() as RootState).auth.locale || (import.meta.env.VITE_DEFAULT_LOCALE as string | undefined);
    if (locale) headers.set("x-locale", locale);

    return headers;
  },
});

// refresh mantığı aynı...
const baseQueryWithReauth: typeof rawBaseQuery = async (args, api, extraOptions) => {
  let result = await rawBaseQuery(args, api, extraOptions);

  if (result.error && (result.error as { status?: unknown }).status === 401) {
    const refreshRes = await rawBaseQuery(
      { url: "/auth/v1/token/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (!refreshRes.error) {
      const access_token = (refreshRes.data as { access_token?: string })?.access_token as string | undefined;
      if (access_token) {
        const s = (store.getState() as RootState).auth.session;
        store.dispatch(
          setSession(
            s ? { ...s, accessToken: access_token }
              : { accessToken: access_token, refreshToken: undefined, expiresIn: 900, tokenType: "bearer", user: null }
          )
        );
      }
      result = await rawBaseQuery(args, api, extraOptions);
    } else {
      store.dispatch(resetSession());
    }
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "metahubApi",
  baseQuery: baseQueryWithReauth,
  endpoints: () => ({}),
  tagTypes: [
    "Auth","User","Functions","Profile",
    "Products","Product","Categories","Faqs","Reviews","Options","Stock",
    "Order","Orders","OrderItem","OrderItems",
    "CartItem","CartItems",
    "Coupon","Coupons",
    "BlogPost","BlogPosts",
    "SupportTicket","SupportTickets",
    "TicketReply","TicketReplies",
    "MenuItem","MenuItems",
    "FooterSection","FooterSections",
    "CustomPage","CustomPages",
    "Popup","Popups",
    "EmailTemplate","EmailTemplates",
    "Variant","Variants","Option","Options","OptionValue","OptionValues",
    "WalletTransactions","PaymentRequests",
    "SiteSettings",
    "PaymentProvider","PaymentProviders",
    "PaymentSession","PaymentSessions",
    "StorageUpload",
    "Notification","Notifications",
    "Activity","Activities",
    "Audit","Audits",
    "Telemetry","Telemetries",
    "Health",
    "AuditLogs","ConfigHistory",
    "Subscriptions","Subscription",
    "Promotion",
    "Disputes","Dispute",
    "Settlements","Settlement",
    "Webhooks","Webhook",
    "Flags","Flag",
    "Payments","Payment",
    "OptionGroups","OptionGroup",
    "Roles","Role",
    "Users","User",
    "StockItems","StockItem",
    "CmsPage","CmsPages",
    "CmsBlocks","CmsBlock","CmsBlock",
    "CmsMenus","CmsMenu",
    "Redirects","Redirect",
    "MediaAssets","MediaAsset",
    "MediaFolders","MediaFolder",
    "Permissions","Permission",
    "Invoices","Invoice",
    "UserRoles","UserRole",
    "TopbarSettings","TopbarSetting",

  ] as const,
});

export { rawBaseQuery };
