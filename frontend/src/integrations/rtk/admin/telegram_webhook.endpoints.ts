// ===================================================================
// FILE: src/integrations/metahub/rtk/endpoints/admin/telegram_webhook.endpoints.ts
// FINAL — Telegram webhook admin endpoints (optional simulate)
// ===================================================================

import { baseApi } from '@/integrations/baseApi';
import type {
  TelegramUpdate,
  TelegramWebhookResponse,
} from '@/integrations/types/telegram_webhook';

export const telegramWebhookAdminApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    telegramWebhookSimulate: build.mutation<TelegramWebhookResponse, { update: TelegramUpdate }>({
      query: (body) => ({
        url: '/admin/telegram/webhook/simulate',
        method: 'POST',
        body,
      }),
    }),
  }),
  overrideExisting: false,
});

export const { useTelegramWebhookSimulateMutation } = telegramWebhookAdminApi;
