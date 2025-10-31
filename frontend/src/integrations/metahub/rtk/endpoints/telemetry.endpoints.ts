
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/telemetry.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";

export type TelemetryBase = {
  ts: number;                // epoch ms
  user_id?: string | null;
  session_id?: string | null;
  ctx?: Record<string, unknown> | null; // global context ( locale, ua)
};

export type PageViewEvent = TelemetryBase & { type: "pageview"; path: string; ref?: string | null; title?: string | null };
export type ActionEvent   = TelemetryBase & { type: "action"; name: string; props?: Record<string, unknown> | null };
export type PerfEvent     = TelemetryBase & { type: "perf"; name: string; dur_ms: number; ok: boolean; meta?: Record<string, unknown> | null };

export type TelemetryEvent = PageViewEvent | ActionEvent | PerfEvent;
export type TelemetryIngestBody = { events: TelemetryEvent[] };
export type TelemetryIngestResult = { accepted: number };

export const telemetryApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    sendTelemetry: b.mutation<TelemetryIngestResult, TelemetryIngestBody>({
      query: (body) => ({ url: "/telemetry/ingest", method: "POST", body }),
      transformResponse: (res: unknown): TelemetryIngestResult => (res as TelemetryIngestResult) ?? { accepted: 0 },
      invalidatesTags: [],
    }),
  }),
  overrideExisting: true,
});

export const { useSendTelemetryMutation } = telemetryApi;