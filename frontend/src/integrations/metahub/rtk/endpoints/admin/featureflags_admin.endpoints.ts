
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/featureflags_admin.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../../baseApi";

// helpers
const toNumber = (x: unknown): number => (typeof x === "number" ? x : Number(x as unknown));
const toIso = (x: unknown): string | null => (!x ? null : new Date(x as string | number | Date).toISOString());
const toBool = (x: unknown): boolean => (typeof x === "boolean" ? x : String(x).toLowerCase() === "true" || String(x) === "1");
const asArray = <T>(x: unknown): T[] => (Array.isArray(x) ? (x as T[]) : []);

// ----- Types: Feature Flags -----
export type Variant = { key: string; weight: number; description?: string | null };
export type RolloutRule = { segment_id?: string | null; percentage?: number | null };
export type FeatureFlag = {
  id: string;
  key: string;                    // e.g. "home.hero.new_copy"
  description: string | null;
  is_active: boolean;
  variants: Variant[];            // weights sum to 1 or 100 (BE-defined). We normalize to fraction 0..1
  rollout: RolloutRule | null;    // optional simple rule
  created_at: string;             // ISO
  updated_at: string | null;      // ISO
};

export type ApiVariant = { key: string; weight: number | string; description?: string | null };
export type ApiFeatureFlag = Omit<FeatureFlag, "is_active" | "variants"> & {
  is_active: boolean | 0 | 1 | "0" | "1" | string;
  variants: ApiVariant[] | string; // may come as JSON-string
};

const normalizeVariants = (v: unknown): Variant[] => {
  const arr = typeof v === "string" ? asArray<ApiVariant>(JSON.parse(v)) : asArray<ApiVariant>(v);
  // Normalize weight to fraction (0..1)
  // If any weight > 1, assume it's in percent and divide by 100
  const maxWeight = arr.reduce((m, it) => Math.max(m, toNumber(it.weight)), 0);
  const shouldDivide = maxWeight > 1.000001;
  return arr.map((it) => ({ key: it.key, description: it.description ?? null, weight: shouldDivide ? toNumber(it.weight) / 100 : toNumber(it.weight) }));
};

const normalizeFlag = (f: ApiFeatureFlag): FeatureFlag => ({
  ...f,
  is_active: toBool(f.is_active),
  variants: normalizeVariants(f.variants),
  updated_at: f.updated_at ? toIso(f.updated_at) : null,
});

export type CreateFlagBody = { key: string; description?: string | null; is_active?: boolean; variants?: Variant[]; rollout?: RolloutRule | null };
export type UpdateFlagBody = Partial<CreateFlagBody>;
export type EvaluateBody = { user_id?: string; attributes?: Record<string, unknown> };
export type EvaluateResult = { key: string; variant: string; reason: string };
export type UpdateTrafficBody = { variants: Variant[] };

export type FlagListParams = { q?: string; is_active?: boolean; limit?: number; offset?: number; sort?: "created_at" | "updated_at" | "key"; order?: "asc" | "desc" };

// ----- Types: Segments -----
export type Segment = { id: string; key: string; name: string; description: string | null; created_at: string; updated_at: string | null };

// ----- Types: Experiments -----
export type ExperimentStatus = "draft" | "running" | "paused" | "stopped" | "archived";
export type ExperimentVariant = Variant;
export type Experiment = {
  id: string;
  key: string;                    // e.g. "checkout_button_color"
  name: string;
  status: ExperimentStatus;
  primary_flag_key: string | null; // optional: attached flag key
  hypothesis: string | null;
  start_at: string | null;        // ISO
  end_at: string | null;          // ISO
  variants: ExperimentVariant[];  // normalized to fraction
  created_at: string;             // ISO
  updated_at: string | null;      // ISO
};

export type ApiExperiment = Omit<Experiment, "variants" | "start_at" | "end_at"> & {
  variants: ApiVariant[] | string;
  start_at: string | number | Date | null;
  end_at: string | number | Date | null;
};

const normalizeExperiment = (e: ApiExperiment): Experiment => ({
  ...e,
  variants: normalizeVariants(e.variants),
  start_at: e.start_at ? toIso(e.start_at) : null,
  end_at: e.end_at ? toIso(e.end_at) : null,
  updated_at: e.updated_at ? toIso(e.updated_at) : null,
});

export type ExperimentListParams = { q?: string; status?: ExperimentStatus; limit?: number; offset?: number; sort?: "created_at" | "updated_at" | "key" | "status"; order?: "asc" | "desc" };
export type CreateExperimentBody = { key: string; name: string; primary_flag_key?: string | null; hypothesis?: string | null; variants: ExperimentVariant[] };
export type UpdateExperimentBody = Partial<CreateExperimentBody>;
export type UpdateExperimentTrafficBody = { variants: ExperimentVariant[] };
export type MetricsSummary = { exposures: number; conversions: number; conversion_rate: number; lift?: number | null; p_value?: number | null };
export type ExportResponse = { url: string; expires_at: string | null };
export type Assignment = { id: string; experiment_id: string; user_id: string | null; variant: string; context: Record<string, unknown> | null; created_at: string };
export type ApiAssignment = Omit<Assignment, "created_at" | "context"> & { created_at: string | number | Date; context: string | Record<string, unknown> | null };

const normalizeAssignment = (a: ApiAssignment): Assignment => ({
  ...a,
  created_at: toIso(a.created_at) ?? new Date(0).toISOString(),
  context: typeof a.context === "string" ? ((): Record<string, unknown> | null => { try { return JSON.parse(a.context); } catch { return null; } })() : a.context,
});

export const featureFlagsAdminApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    // ---- Feature Flags ----
    listFeatureFlagsAdmin: b.query<FeatureFlag[], FlagListParams | void>({
      query: (params) => ({ url: "/feature-flags", params }),
      transformResponse: (res: unknown): FeatureFlag[] => {
        if (Array.isArray(res)) return (res as ApiFeatureFlag[]).map(normalizeFlag);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiFeatureFlag[]).map(normalizeFlag) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((f) => ({ type: "FeatureFlags" as const, id: f.id })),
        { type: "FeatureFlags" as const, id: "LIST" },
      ] : [{ type: "FeatureFlags" as const, id: "LIST" }],
      keepUnusedDataFor: 60,
    }),

    getFeatureFlagAdminById: b.query<FeatureFlag, string>({
      query: (id) => ({ url: `/feature-flags/${id}` }),
      transformResponse: (res: unknown): FeatureFlag => normalizeFlag(res as ApiFeatureFlag),
      providesTags: (_r, _e, id) => [{ type: "FeatureFlags", id }],
    }),

    createFeatureFlagAdmin: b.mutation<FeatureFlag, CreateFlagBody>({
      query: (body) => ({ url: "/feature-flags", method: "POST", body }),
      transformResponse: (res: unknown): FeatureFlag => normalizeFlag(res as ApiFeatureFlag),
      invalidatesTags: [{ type: "FeatureFlags" as const, id: "LIST" }],
    }),

    updateFeatureFlagAdmin: b.mutation<FeatureFlag, { id: string; body: UpdateFlagBody }>({
      query: ({ id, body }) => ({ url: `/feature-flags/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): FeatureFlag => normalizeFlag(res as ApiFeatureFlag),
      invalidatesTags: (_r, _e, arg) => [{ type: "FeatureFlags", id: arg.id }, { type: "FeatureFlags", id: "LIST" }],
    }),

    deleteFeatureFlagAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/feature-flags/${id}`, method: "DELETE" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "FeatureFlags" as const, id: "LIST" }],
    }),

    toggleFeatureFlagAdmin: b.mutation<FeatureFlag, string>({
      query: (id) => ({ url: `/feature-flags/${id}/toggle`, method: "POST" }),
      transformResponse: (res: unknown): FeatureFlag => normalizeFlag(res as ApiFeatureFlag),
      invalidatesTags: (_r, _e, id) => [{ type: "FeatureFlags", id }],
    }),

    evaluateFeatureFlagAdmin: b.mutation<EvaluateResult, { key: string; body?: EvaluateBody }>({
      query: ({ key, body }) => ({ url: `/feature-flags/${encodeURIComponent(key)}/evaluate`, method: "POST", body }),
      transformResponse: (res: unknown): EvaluateResult => {
        const r = res as { key?: unknown; variant?: unknown; reason?: unknown };
        return { key: String(r?.key ?? ""), variant: String(r?.variant ?? ""), reason: String(r?.reason ?? "") };
      },
    }),

    updateFeatureFlagTrafficAdmin: b.mutation<FeatureFlag, { id: string; body: UpdateTrafficBody }>({
      query: ({ id, body }) => ({ url: `/feature-flags/${id}/traffic`, method: "POST", body }),
      transformResponse: (res: unknown): FeatureFlag => normalizeFlag(res as ApiFeatureFlag),
      invalidatesTags: (_r, _e, arg) => [{ type: "FeatureFlags", id: arg.id }, { type: "FeatureFlags", id: "LIST" }],
    }),

    // ---- Segments ----
    listSegmentsAdmin: b.query<Segment[], { q?: string } | void>({
      query: (params) => ({ url: "/segments", params }),
      transformResponse: (res: unknown): Segment[] => {
        if (Array.isArray(res)) return res as Segment[];
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as Segment[]) : [];
      },
      providesTags: [{ type: "Segments" as const, id: "LIST" }],
    }),

    // ---- Experiments ----
    listExperimentsAdmin: b.query<Experiment[], ExperimentListParams | void>({
      query: (params) => ({ url: "/experiments", params }),
      transformResponse: (res: unknown): Experiment[] => {
        if (Array.isArray(res)) return (res as ApiExperiment[]).map(normalizeExperiment);
        const maybe = res as { data?: unknown };
        return Array.isArray(maybe?.data) ? (maybe.data as ApiExperiment[]).map(normalizeExperiment) : [];
      },
      providesTags: (result) => result ? [
        ...result.map((e) => ({ type: "Experiments" as const, id: e.id })),
        { type: "Experiments" as const, id: "LIST" },
      ] : [{ type: "Experiments" as const, id: "LIST" }],
    }),

    getExperimentAdminById: b.query<Experiment, string>({
      query: (id) => ({ url: `/experiments/${id}` }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      providesTags: (_r, _e, id) => [{ type: "Experiments", id }],
    }),

    createExperimentAdmin: b.mutation<Experiment, CreateExperimentBody>({
      query: (body) => ({ url: "/experiments", method: "POST", body }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      invalidatesTags: [{ type: "Experiments" as const, id: "LIST" }],
    }),

    updateExperimentAdmin: b.mutation<Experiment, { id: string; body: UpdateExperimentBody }>({
      query: ({ id, body }) => ({ url: `/experiments/${id}`, method: "PATCH", body }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      invalidatesTags: (_r, _e, arg) => [{ type: "Experiments", id: arg.id }, { type: "Experiments", id: "LIST" }],
    }),

    startExperimentAdmin: b.mutation<Experiment, string>({
      query: (id) => ({ url: `/experiments/${id}/start`, method: "POST" }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      invalidatesTags: (_r, _e, id) => [{ type: "Experiments", id }, { type: "Experiments", id: "LIST" }],
    }),

    pauseExperimentAdmin: b.mutation<Experiment, string>({
      query: (id) => ({ url: `/experiments/${id}/pause`, method: "POST" }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      invalidatesTags: (_r, _e, id) => [{ type: "Experiments", id }],
    }),

    stopExperimentAdmin: b.mutation<Experiment, string>({
      query: (id) => ({ url: `/experiments/${id}/stop`, method: "POST" }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      invalidatesTags: (_r, _e, id) => [{ type: "Experiments", id }],
    }),

    archiveExperimentAdmin: b.mutation<{ ok: true }, string>({
      query: (id) => ({ url: `/experiments/${id}/archive`, method: "POST" }),
      transformResponse: () => ({ ok: true as const }),
      invalidatesTags: [{ type: "Experiments" as const, id: "LIST" }],
    }),

    updateExperimentTrafficAdmin: b.mutation<Experiment, { id: string; body: UpdateExperimentTrafficBody }>({
      query: ({ id, body }) => ({ url: `/experiments/${id}/traffic`, method: "POST", body }),
      transformResponse: (res: unknown): Experiment => normalizeExperiment(res as ApiExperiment),
      invalidatesTags: (_r, _e, arg) => [{ type: "Experiments", id: arg.id }],
    }),

    listExperimentAssignmentsAdmin: b.query<Assignment[], { id: string; limit?: number; offset?: number }>(
      {
        query: ({ id, ...params }) => ({ url: `/experiments/${id}/assignments`, params }),
        transformResponse: (res: unknown): Assignment[] => {
          if (Array.isArray(res)) return (res as ApiAssignment[]).map(normalizeAssignment);
          const maybe = res as { data?: unknown };
          return Array.isArray(maybe?.data) ? (maybe.data as ApiAssignment[]).map(normalizeAssignment) : [];
        },
        providesTags: (_r, _e, arg) => [{ type: "ExperimentAssignments" as const, id: arg.id }],
      }
    ),

    getExperimentMetricsSummaryAdmin: b.query<MetricsSummary, string>({
      query: (id) => ({ url: `/experiments/${id}/metrics/summary` }),
      transformResponse: (res: unknown): MetricsSummary => {
        const r = res as { exposures?: unknown; conversions?: unknown; conversion_rate?: unknown; lift?: unknown; p_value?: unknown };
        const exposures = toNumber(r?.exposures ?? 0);
        const conversions = toNumber(r?.conversions ?? 0);
        const conversion_rate = exposures > 0 ? conversions / exposures : 0;
        const lift = r?.lift == null ? null : toNumber(r.lift);
        const p_value = r?.p_value == null ? null : toNumber(r.p_value);
        return { exposures, conversions, conversion_rate, lift, p_value };
      },
      providesTags: (_r, _e, id) => [{ type: "ExperimentMetrics", id }],
    }),

    exportExperimentMetricsAdmin: b.mutation<ExportResponse, { id: string; format?: "csv" | "xlsx" }>(
      {
        query: ({ id, ...params }) => ({ url: `/experiments/${id}/metrics/export`, method: "GET", params }),
        transformResponse: (res: unknown): ExportResponse => {
          const r = res as { url?: unknown; expires_at?: unknown };
          return { url: String(r?.url ?? ""), expires_at: r?.expires_at ? toIso(r.expires_at) : null };
        },
      }
    ),
  }),
  overrideExisting: true,
});

export const {
  // flags
  useListFeatureFlagsAdminQuery,
  useGetFeatureFlagAdminByIdQuery,
  useCreateFeatureFlagAdminMutation,
  useUpdateFeatureFlagAdminMutation,
  useDeleteFeatureFlagAdminMutation,
  useToggleFeatureFlagAdminMutation,
  useEvaluateFeatureFlagAdminMutation,
  useUpdateFeatureFlagTrafficAdminMutation,
  useListSegmentsAdminQuery,
  // experiments
  useListExperimentsAdminQuery,
  useGetExperimentAdminByIdQuery,
  useCreateExperimentAdminMutation,
  useUpdateExperimentAdminMutation,
  useStartExperimentAdminMutation,
  usePauseExperimentAdminMutation,
  useStopExperimentAdminMutation,
  useArchiveExperimentAdminMutation,
  useUpdateExperimentTrafficAdminMutation,
  useListExperimentAssignmentsAdminQuery,
  useGetExperimentMetricsSummaryAdminQuery,
  useExportExperimentMetricsAdminMutation,
} = featureFlagsAdminApi;