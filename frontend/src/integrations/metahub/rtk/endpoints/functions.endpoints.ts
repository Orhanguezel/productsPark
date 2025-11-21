// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/functions.endpoints.ts
// =============================================================
import { baseApi } from "../baseApi";
import type { FetchArgs } from "@reduxjs/toolkit/query";
import type {
  PaytrTokenResult,
  ShopierPaymentFormResult,
  BalanceResult,
} from "@/integrations/metahub/core/public-api";
import type {
  TurkpinGameListResult,
  TurkpinProductListResult,
  TurkpinListType,
} from "@/integrations/metahub/rtk/types/turkpin";

const FN_BASE = "/functions";

/* ---------------- Request / Response tipleri ---------------- */

export type PaytrTokenBody = {
  email?: string;
  payment_amount?: number | string; // kuruş
  merchant_oid?: string;
  user_ip?: string;
  installment?: number | string;
  no_installment?: number | string;
  max_installment?: number | string;
  currency?: string; // 'TL'
  basket?: Array<[string, number, number]>; // [name, unit_price, qty]
  lang?: string;
};

/**
 * Backend send-email fonksiyonu hem klasik subject/html/text
 * hem de template_key + variables tarzı body alabiliyor.
 * O yüzden FE tipini geniş tuttuk.
 */
export type SendEmailBody = {
  to: string;

  // Klasik kullanım
  subject?: string;
  html?: string;
  text?: string;

  // Template tabanlı kullanım
  template_key?: string;
  variables?: Record<string, unknown>;
};

export type ManualDeliveryEmailBody = {
  to: string;
  customer_name?: string;
  order_number?: string;
  delivery_content: string;
  site_name?: string;
};

export type TelegramNotificationBody = Record<string, unknown>;

export type SmmApiOrderBody = Record<string, unknown>;
export type SmmApiStatusBody = Record<string, unknown>;
export type TurkpinCreateOrderBody = Record<string, unknown>;

/** Turkpin listeleri için body tipleri (type dosyasındaki TurkpinListType kullanılıyor) */
export type TurkpinGameListBody = {
  providerId: string;
  listType: TurkpinListType; // "epin" | "topup"
};

export type TurkpinProductListBody = {
  providerId: string;
  gameId: string;
  listType: TurkpinListType; // "epin" | "topup"
};

/** Turkpin bakiye sorgusu için body tipi */
export type TurkpinBalanceBody = {
  providerId: string;
};

export type SimpleSuccessResp = {
  success: boolean;
  error?: string;
};

/* Kullanıcı sipariş silme fonksiyonu için tipler */
export type DeleteUserOrdersBody = {
  email: string;
};

export type DeleteUserOrdersResp = {
  success: boolean;
  message?: string;
  error?: string;
};

export type SmmApiOrderResp = {
  success: boolean;
  order_id: string;
  status: string;
};

export type SmmApiStatusResp = {
  success: boolean;
  status: string;
};

export type TurkpinCreateOrderResp = {
  success: boolean;
  order_id: string;
  status: string;
};

/* ---------------- RTK endpoints ---------------- */

export const functionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /functions/paytr-get-token */
    paytrGetToken: b.mutation<PaytrTokenResult, PaytrTokenBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/paytr-get-token`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/paytr-havale-get-token */
    paytrHavaleGetToken: b.mutation<PaytrTokenResult, PaytrTokenBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/paytr-havale-get-token`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/shopier-create-payment */
    shopierCreatePayment: b.mutation<
      ShopierPaymentFormResult,
      Record<string, unknown>
    >({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/shopier-create-payment`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/send-email */
    sendEmail: b.mutation<SimpleSuccessResp, SendEmailBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/send-email`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/manual-delivery-email */
    manualDeliveryEmail: b.mutation<
      SimpleSuccessResp,
      ManualDeliveryEmailBody
    >({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/manual-delivery-email`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/send-telegram-notification */
    sendTelegramNotification: b.mutation<
      { success: boolean },
      TelegramNotificationBody
    >({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/send-telegram-notification`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/smm-api-order */
    smmApiOrder: b.mutation<SmmApiOrderResp, SmmApiOrderBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/smm-api-order`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/smm-api-status */
    smmApiStatus: b.mutation<SmmApiStatusResp, SmmApiStatusBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/smm-api-status`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/turkpin-create-order */
    turkpinCreateOrder: b.mutation<
      TurkpinCreateOrderResp,
      TurkpinCreateOrderBody
    >({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-create-order`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/turkpin-game-list */
    turkpinGameList: b.mutation<TurkpinGameListResult, TurkpinGameListBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-game-list`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/turkpin-product-list */
    turkpinProductList: b.mutation<
      TurkpinProductListResult,
      TurkpinProductListBody
    >({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-product-list`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/turkpin-balance */
    turkpinBalance: b.mutation<BalanceResult, TurkpinBalanceBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-balance`,
        method: "POST",
        body,
      }),
    }),

    /** POST /functions/delete-user-orders */
    deleteUserOrders: b.mutation<
      DeleteUserOrdersResp,
      DeleteUserOrdersBody
    >({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/delete-user-orders`,
        method: "POST",
        body,
      }),
    }),

    /** GET /functions/sitemap  (XML string döner) */
    sitemap: b.query<string, void>({
      query: (): FetchArgs => ({
        url: `${FN_BASE}/sitemap`,
        method: "GET",
        // text response almak için (fetchBaseQuery'de built-in)
        responseHandler: "text",
      }),
    }),
  }),
  overrideExisting: true,
});

export const {
  usePaytrGetTokenMutation,
  usePaytrHavaleGetTokenMutation,
  useShopierCreatePaymentMutation,
  useSendEmailMutation,
  useManualDeliveryEmailMutation,
  useSendTelegramNotificationMutation,
  useSmmApiOrderMutation,
  useSmmApiStatusMutation,
  useTurkpinCreateOrderMutation,
  useTurkpinGameListMutation,
  useTurkpinProductListMutation,
  useTurkpinBalanceMutation,
  useDeleteUserOrdersMutation,
  useSitemapQuery,
} = functionsApi;
