
// -------------------------------------------------------------
// FILE: src/integrations/metahub/client/admin/flags.ts (Facade)
// -------------------------------------------------------------
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import {
  featureFlagsAdminApi,
  type FeatureFlag,
  type FlagListParams,
  type CreateFlagBody,
  type UpdateFlagBody,
  type EvaluateBody,
  type EvaluateResult,
  type UpdateTrafficBody,
  type Segment,
  type Experiment,
  type ExperimentListParams,
  type CreateExperimentBody,
  type UpdateExperimentBody,
  type UpdateExperimentTrafficBody,
  type Assignment,
  type MetricsSummary,
  type ExportResponse,
} from "@/integrations/metahub/rtk/endpoints/admin/featureflags_admin.endpoints";

export const flagsAdmin = {
  // Flags
  async listFlags(params?: FlagListParams) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.listFeatureFlagsAdmin.initiate(params)).unwrap(); return { data: data as FeatureFlag[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as FeatureFlag[] | null, error: { message } }; }
  },
  async getFlag(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.getFeatureFlagAdminById.initiate(id)).unwrap(); return { data: data as FeatureFlag, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as FeatureFlag | null, error: { message } }; }
  },
  async createFlag(body: CreateFlagBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.createFeatureFlagAdmin.initiate(body)).unwrap(); return { data: data as FeatureFlag, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as FeatureFlag | null, error: { message } }; }
  },
  async updateFlag(id: string, body: UpdateFlagBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.updateFeatureFlagAdmin.initiate({ id, body })).unwrap(); return { data: data as FeatureFlag, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as FeatureFlag | null, error: { message } }; }
  },
  async deleteFlag(id: string) {
    try {
      await store.dispatch(featureFlagsAdminApi.endpoints.deleteFeatureFlagAdmin.initiate(id)).unwrap(); return { ok: true as const };
    } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; }
  },
  async toggleFlag(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.toggleFeatureFlagAdmin.initiate(id)).unwrap(); return { data: data as FeatureFlag, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as FeatureFlag | null, error: { message } }; }
  },
  async evaluateFlag(key: string, body?: EvaluateBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.evaluateFeatureFlagAdmin.initiate({ key, body })).unwrap(); return { data: data as EvaluateResult, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as EvaluateResult | null, error: { message } }; }
  },
  async updateFlagTraffic(id: string, body: UpdateTrafficBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.updateFeatureFlagTrafficAdmin.initiate({ id, body })).unwrap(); return { data: data as FeatureFlag, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as FeatureFlag | null, error: { message } }; }
  },
  async segments(params?: { q?: string }) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.listSegmentsAdmin.initiate(params)).unwrap(); return { data: data as Segment[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Segment[] | null, error: { message } }; }
  },

  // Experiments
  async listExperiments(params?: ExperimentListParams) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.listExperimentsAdmin.initiate(params)).unwrap(); return { data: data as Experiment[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment[] | null, error: { message } }; }
  },
  async getExperiment(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.getExperimentAdminById.initiate(id)).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async createExperiment(body: CreateExperimentBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.createExperimentAdmin.initiate(body)).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async updateExperiment(id: string, body: UpdateExperimentBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.updateExperimentAdmin.initiate({ id, body })).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async startExperiment(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.startExperimentAdmin.initiate(id)).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async pauseExperiment(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.pauseExperimentAdmin.initiate(id)).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async stopExperiment(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.stopExperimentAdmin.initiate(id)).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async archiveExperiment(id: string) {
    try {
      await store.dispatch(featureFlagsAdminApi.endpoints.archiveExperimentAdmin.initiate(id)).unwrap(); return { ok: true as const };
    } catch (e) { const { message } = normalizeError(e); return { ok: false as const, error: { message } } as const; }
  },
  async updateExperimentTraffic(id: string, body: UpdateExperimentTrafficBody) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.updateExperimentTrafficAdmin.initiate({ id, body })).unwrap(); return { data: data as Experiment, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Experiment | null, error: { message } }; }
  },
  async assignments(id: string, params?: { limit?: number; offset?: number }) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.listExperimentAssignmentsAdmin.initiate({ id, ...params })).unwrap(); return { data: data as Assignment[], error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as Assignment[] | null, error: { message } }; }
  },
  async metricsSummary(id: string) {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.getExperimentMetricsSummaryAdmin.initiate(id)).unwrap(); return { data: data as MetricsSummary, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as MetricsSummary | null, error: { message } }; }
  },
  async exportMetrics(id: string, format: "csv" | "xlsx" = "xlsx") {
    try {
      const data = await store.dispatch(featureFlagsAdminApi.endpoints.exportExperimentMetricsAdmin.initiate({ id, format })).unwrap(); return { data: data as ExportResponse, error: null as null };
    } catch (e) { const { message } = normalizeError(e); return { data: null as ExportResponse | null, error: { message } }; }
  },
};

export type { FeatureFlag, FlagListParams, CreateFlagBody, UpdateFlagBody, EvaluateBody, EvaluateResult, UpdateTrafficBody, Segment, Experiment, ExperimentListParams, CreateExperimentBody, UpdateExperimentBody, UpdateExperimentTrafficBody, Assignment, MetricsSummary, ExportResponse };
