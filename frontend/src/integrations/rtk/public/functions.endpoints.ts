// =============================================================
// FILE: src/integrations/metahub/rtk/endpoints/functions.endpoints.ts
// FINAL — Functions RTK (+ sendTestMail)
// - Telegram endpoints REMOVED (moved to telegram.endpoints.ts)
// =============================================================
import { baseApi } from '@/integrations/baseApi';
import type { FetchArgs } from '@reduxjs/toolkit/query';

import type {
  PaytrTokenResult,
  PaytrTokenBody,
  ShopierPaymentFormResult,
  SimpleSuccessResp,
  SendEmailBody,
  ManualDeliveryEmailBody,
  SmmApiOrderBody,
  SmmApiOrderResp,
  SmmApiStatusBody,
  SmmApiStatusResp,
  TurkpinCreateOrderBody,
  TurkpinCreateOrderResp,
  TurkpinGameListBody,
  TurkpinProductListBody,
  TurkpinBalanceBody,
  BalanceResult,
  DeleteUserOrdersBody,
  DeleteUserOrdersResp,
  TurkpinGameListResult,
  TurkpinProductListResult,
  ShopierCallbackBody,
  SendTestMailBody,
  SendTestMailResp,
} from '@/integrations/types';

const FN_BASE = '/functions';

export const functionsApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /functions/paytr-get-token */
    paytrGetToken: b.mutation<PaytrTokenResult, PaytrTokenBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/paytr-get-token`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/paytr-havale-get-token */
    paytrHavaleGetToken: b.mutation<PaytrTokenResult, PaytrTokenBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/paytr-havale-get-token`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/shopier-create-payment */
    shopierCreatePayment: b.mutation<ShopierPaymentFormResult, Record<string, unknown>>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/shopier-create-payment`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/send-email */
    sendEmail: b.mutation<SimpleSuccessResp, SendEmailBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/send-email`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/send-test-mail */
    sendTestMail: b.mutation<SendTestMailResp, SendTestMailBody | void>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/send-test-mail`,
        method: 'POST',
        body: body ?? {}, // ✅ void gelirse {} gönder
      }),
    }),

    /** POST /functions/manual-delivery-email */
    manualDeliveryEmail: b.mutation<SimpleSuccessResp, ManualDeliveryEmailBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/manual-delivery-email`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/smm-api-order */
    smmApiOrder: b.mutation<SmmApiOrderResp, SmmApiOrderBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/smm-api-order`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/smm-api-status */
    smmApiStatus: b.mutation<SmmApiStatusResp, SmmApiStatusBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/smm-api-status`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/turkpin-create-order */
    turkpinCreateOrder: b.mutation<TurkpinCreateOrderResp, TurkpinCreateOrderBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-create-order`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/turkpin-game-list */
    turkpinGameList: b.mutation<TurkpinGameListResult, TurkpinGameListBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-game-list`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/turkpin-product-list */
    turkpinProductList: b.mutation<TurkpinProductListResult, TurkpinProductListBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-product-list`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/turkpin-balance */
    turkpinBalance: b.mutation<BalanceResult, TurkpinBalanceBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/turkpin-balance`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/delete-user-orders */
    deleteUserOrders: b.mutation<DeleteUserOrdersResp, DeleteUserOrdersBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/delete-user-orders`,
        method: 'POST',
        body,
      }),
    }),

    /** POST /functions/shopier-callback */
    shopierCallback: b.mutation<SimpleSuccessResp, ShopierCallbackBody>({
      query: (body): FetchArgs => ({
        url: `${FN_BASE}/shopier-callback`,
        method: 'POST',
        body,
      }),
    }),

    /** GET /functions/sitemap (XML string) */
    sitemap: b.query<string, void>({
      query: (): FetchArgs => ({
        url: `${FN_BASE}/sitemap`,
        method: 'GET',
        responseHandler: 'text',
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
  useSendTestMailMutation,
  useManualDeliveryEmailMutation,

  useSmmApiOrderMutation,
  useSmmApiStatusMutation,

  useTurkpinCreateOrderMutation,
  useTurkpinGameListMutation,
  useTurkpinProductListMutation,
  useTurkpinBalanceMutation,

  useShopierCallbackMutation,

  useDeleteUserOrdersMutation,
  useSitemapQuery,
} = functionsApi;
