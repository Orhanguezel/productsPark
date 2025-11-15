// ===================================================================
// FILE: src/integrations/metahub/rtk/endpoints/mail.endpoints.ts
// ===================================================================
import { baseApi } from "../baseApi";

/** POST /mail/send body tipi (sendMailSchema ile uyumlu) */
export interface SendMailBody {
  to: string;
  subject: string;
  text?: string | null;
  html?: string | null;
}

/**
 * POST /mail/order-created body tipi
 *
 * Backend: OrderCreatedMailInput (orderCreatedMailSchema)
 *  {
 *    to: string;
 *    customer_name: string;
 *    order_number: string;
 *    final_amount: string;
 *    status: string;
 *    site_name?: string;
 *    locale?: string;
 *  }
 */
export interface OrderCreatedMailBody {
  to: string;
  customer_name: string;
  order_number: string;
  final_amount: string;
  status: string;
  site_name?: string;
  locale?: string;
}

/** Mail endpoint'leri çoğunlukla side-effect, sadece { ok: true } döner */
interface MailOkResponse {
  ok: boolean;
}

export const mailApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    /**
     * POST /mail/test
     * Body: { to?: string }
     * - Eğer body.to yoksa backend req.user.email kullanıyor.
     */
    sendTestMail: build.mutation<MailOkResponse, { to?: string } | void>({
      query: (body) => ({
        url: "/mail/test",
        method: "POST",
        body: body ?? {},
      }),
      transformResponse: (res: unknown): MailOkResponse => {
        if (res && typeof res === "object" && "ok" in res) {
          return res as MailOkResponse;
        }
        return { ok: true };
      },
    }),

    /**
     * POST /mail/send
     * Genel amaçlı mail gönderimi
     */
    sendMail: build.mutation<MailOkResponse, SendMailBody>({
      query: (body) => ({
        url: "/mail/send",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): MailOkResponse => {
        if (res && typeof res === "object" && "ok" in res) {
          return res as MailOkResponse;
        }
        return { ok: true };
      },
    }),

    /**
     * POST /mail/order-created
     * (Genelde debug / manuel tetikleme için; normal flow orders controller
     * içinden direkt sendOrderCreatedMail çağırıyor)
     */
    sendOrderCreatedMailApi: build.mutation<
      MailOkResponse,
      OrderCreatedMailBody
    >({
      query: (body) => ({
        url: "/mail/order-created",
        method: "POST",
        body,
      }),
      transformResponse: (res: unknown): MailOkResponse => {
        if (res && typeof res === "object" && "ok" in res) {
          return res as MailOkResponse;
        }
        return { ok: true };
      },
    }),
  }),
  overrideExisting: true,
});

export const {
  useSendTestMailMutation,
  useSendMailMutation,
  useSendOrderCreatedMailApiMutation,
} = mailApi;
