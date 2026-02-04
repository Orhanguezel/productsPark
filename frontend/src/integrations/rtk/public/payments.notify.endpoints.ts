// -------------------------------------------------------------
// FILE: src/integrations/rtk/public/payments.notify.endpoints.ts
// Public payments notify endpoints (Shopier)
// -------------------------------------------------------------

import { baseApi } from '@/integrations/baseApi';

import type { SimpleSuccessResp, ShopierCallbackBody } from '@/integrations/types';

const BASE = '/shopier/notify';

export const paymentsNotifyApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    /** POST /shopier/notify */
    shopierNotify: b.mutation<SimpleSuccessResp, ShopierCallbackBody>({
      query: (body) => ({
        url: BASE,
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: true,
});

export const { useShopierNotifyMutation } = paymentsNotifyApi;
