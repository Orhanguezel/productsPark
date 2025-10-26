// src/integrations/metahub/client/functions/client.ts
import { store } from "@/store";
import { functionsApi } from "@/integrations/metahub/rtk/endpoints/functions.endpoints";
import type { FunctionsFacade } from "@/integrations/metahub/core/public-api";
import { normalizeError } from "@/integrations/metahub/core/errors";

type InvokeArgs = Readonly<{ body?: unknown }>;

export const functions: FunctionsFacade = {
  async invoke<T = unknown>(name: string, args: InvokeArgs = {}) {
    // Body'yi aynen ilet
    try {
      const { result } = await store
        .dispatch(
          functionsApi.endpoints.invokeFunction.initiate({ name, body: args.body })
        )
        .unwrap();
      return { data: result as T, error: null };
    } catch (e: unknown) {
      const { message, status } = normalizeError(e);
      return { data: null, error: { message, status } };
    }
  },
};
