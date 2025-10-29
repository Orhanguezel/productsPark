// =============================================================
// FILE: src/integrations/metahub/db/normalizers/index.ts
// =============================================================
export { normalizeBlogRows } from "./blog";
export { normalizeCategoryRows } from "./categories";
export { normalizeMenuItemRows } from "./menuItems";
export { normalizePopupRows } from "./popups";
export { normalizeProductRows } from "./products";
export { normalizeProductReviewRows } from "./productReviews";
export { normalizeProductFaqRows } from "./productFaqs";
export { normalizeFooterSectionRows } from "./footerSections";
export { normalizeCartItemRows } from "./cartItems";
export { normalizeOrderRows } from "./orders";
export { normalizeOrderItemRows } from "./orderItems";
export { normalizeCouponRows } from "./coupons";
export { normalizeTopbarRows } from "./topbar";
export { normalizeCustomPageRows } from "./customPages";
export { normalizeSupportTicketRows } from "./supportTickets";
export { normalizeTicketReplyRows } from "./ticketReplies";
export { normalizeWalletTransactionRows } from "./walletTransactions";
export { normalizeWalletDepositRequestRows } from "./walletDepositRequests";
export { normalizeProfileRows } from "./profiles";
export { normalizeProductStockRows } from "./productStock";
export { normalizeApiProviderRows } from "./apiProviders";
export { normalizeSiteSettingRows } from "./site";

export { isProductsPath } from "./_shared";
