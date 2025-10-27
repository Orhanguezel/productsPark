// =============================================================
// FILE: src/integrations/metahub/client.ts
// =============================================================
import { auth } from "./client/auth/client";
import { user_roles } from "./client/user_roles/client";
import { functions } from "./client/functions/client";
import { products } from "./client/products/client";
import { categories } from "./client/categories/client";
import { settings } from "./client/settings/client";
import { storage, metahubstorage } from "./client/storage/client";

import { orders } from "./client/orders/client";
import { carts } from "./client/carts/client";
import { coupons } from "./client/coupons/client";
import { blog } from "./client/blog/client";

import { navigation } from "./client/navigation/client";
import { catalogExtras } from "./client/catalog-extras/client";
import { walletsPayments } from "./client/wallets-payments/client";
import { settings2 } from "./client/site-settings/client";

import { variants } from "./client/variants/client";
import { options } from "./client/options/client";

import * as telemetry from "./observability/telemetry";
import * as sentry from "./observability/sentry";
import * as logtail from "./observability/logtail";
import * as qa from "./qa/checklist";
import * as loadtest from "./testing/loadtest";
import * as cachePolicy from "./rtk/helpers/cachePolicy";
import { enableAutoRefetch } from "./rtk/helpers/autorefresh";
import { useDebouncedValue } from "./hooks/useDebouncedValue";
import * as selectUtil from "./rtk/helpers/selectFromResult";
import * as featureFlags from "./feature-flags/featureFlags";
import { useFeatureFlag } from "./feature-flags/useFeatureFlag";
import { health } from "./client/health/client";
import * as notify from "./ui/toast/helpers";
import * as bulk from "./utils/bulk";
import * as dsl from "./search/dsl";
import * as routePrefetch from "./rtk/helpers/routePrefetch";
import { notifications } from "./client/notifications/client";
import { activity } from "./client/activity/client";
import { audit } from "./client/audit/client";
import * as exportsUtil from "./utils/exports";
import * as rbac from "./utils/rbac";
import * as seoMeta from "./seo/meta";
import * as seoJsonld from "./seo/jsonld";
import { payments } from "./client/payments/client";
import { uploader } from "./client/uploader/client";
import { menu_items } from "./client/menu_items/client";
import { popups } from "./client/popup/client";
import { topbar_settings } from "./client/topbar_settings/client";
import { footer_sections } from "./client/footerSections/client";
import { custom_pages } from "./client/customPages/client";
import { support_tickets } from "./client/support/client";
import { profilesClient } from "./client/profiles/client";
import { rpc } from "./client/rpc/client";

import { siteSettingsAdmin } from "./client/admin/siteSettings";
import { categoriesAdmin } from "./client/admin/categories";
import { productsAdmin } from "./client/admin/products";
import { blogAdmin } from "./client/admin/blog";
import { optionsAdmin } from "./client/admin/options";
import { variantsAdmin } from "./client/admin/variants";
import { reviewsAdmin } from "./client/admin/reviews";
import { couponsAdmin } from "./client/admin/coupons";
import { ordersAdmin } from "./client/admin/orders";
import { cartsAdmin } from "./client/admin/carts";
import { paymentsAdmin } from "./client/admin/payments";
import { refundsAdmin } from "./client/admin/refunds";
import { campaignsAdmin } from "./client/admin/campaigns";
import { giftCardsAdmin } from "./client/admin/giftCards";
import { payoutsAdmin } from "./client/admin/payouts";
import { invoicesAdmin } from "./client/admin/invoices";
import { subscriptionsAdmin } from "./client/admin/subscriptions";
import { promotionsAdmin } from "./client/admin/promotions";
import { disputesAdmin } from "./client/admin/disputes";
import { settlementsAdmin } from "./client/admin/settlements";
import { webhooksAdmin } from "./client/admin/webhooks";
import { auditAdmin } from "./client/admin/audit";
import { flagsAdmin } from "./client/admin/flags";
import { cmsAdmin } from "./client/admin/cms";
import { settingsAdmin } from "./client/admin/settings";
import { mediaAdmin } from "./client/admin/media";
import { usersAdmin } from "./client/admin/users";
import { rbacAdmin } from "./client/admin/rbac";
import { billingAdmin } from "./client/admin/billing";
import { inventoryAdmin } from "./client/admin/inventory";

import { baseApi } from "./rtk/baseApi";
import * as rtk from "./rtk";
import { from as fromDb, type FromFn } from "./db/from";
import { channel, removeChannel, removeAllChannels } from "./realtime/channel";

export const metahub = {
  // Facades
  auth,
  functions,
  rpc,
  products,
  categories,
  settings,
  storage,
  orders,
  carts,
  coupons,
  blog,
  navigation,
  catalogExtras,
  walletsPayments,
  settings2,
  payments,
  uploader,
  variants,
  options,
  telemetry,
  sentry,
  logtail,
  qa,
  loadtest,
  cachePolicy,
  enableAutoRefetch,
  useDebouncedValue,
  selectUtil,
  featureFlags,
  useFeatureFlag,
  health,
  notify,
  bulk,
  dsl,
  routePrefetch,
  notifications,
  activity,
  audit,
  exports: exportsUtil,
  rbac,
  seo: { meta: seoMeta, jsonld: seoJsonld },
  menu_items,
  popups,
  user_roles,
  topbar_settings,
  footer_sections,
  custom_pages,
  support_tickets,
  profiles: profilesClient,

  admin: {
    siteSettings: siteSettingsAdmin,
    categories: categoriesAdmin,
    products: productsAdmin,
    blog: blogAdmin,
    options: optionsAdmin,
    variants: variantsAdmin,
    reviews: reviewsAdmin,
    coupons: couponsAdmin,
    orders: ordersAdmin,
    carts: cartsAdmin,
    payments: paymentsAdmin,
    refunds: refundsAdmin,
    campaigns: campaignsAdmin,
    giftCards: giftCardsAdmin,
    payouts: payoutsAdmin,
    invoices: invoicesAdmin,
    subscriptions: subscriptionsAdmin,
    promotions: promotionsAdmin,
    disputes: disputesAdmin,
    settlements: settlementsAdmin,
    webhooks: webhooksAdmin,
    audit: auditAdmin,
    flags: flagsAdmin,
    cms: cmsAdmin,
    settings: settingsAdmin,
    media: mediaAdmin,
    users: usersAdmin,
    rbac: rbacAdmin,
    billing: billingAdmin,
    inventory: inventoryAdmin,
  },

  // RTK + helpers
  api: rtk,
  baseApi,
  from: fromDb as FromFn,
  channel,
  removeChannel,
  removeAllChannels,
} as const;

export { metahubstorage };
export type Metahub = typeof metahub;
