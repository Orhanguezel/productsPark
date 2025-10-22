// src/integrations/metahub/functions/client.ts
import { store } from "@/store";
import { functionsApi } from "@/integrations/metahub/rtk/endpoints/functions.endpoints";
import type { FunctionsFacade } from "@/integrations/metahub/core/public-api";
import { normalizeError } from "@/integrations/metahub/core/errors";

// İstersen reusability için küçük bir tip:
type InvokeArgs = Readonly<{ body?: unknown }>;

export const functions: FunctionsFacade = {
  async invoke<T = unknown>(name: string, args: InvokeArgs = {}) {
    const { body } = args; // <-- burada artık 'body' tipi known
    try {
      const { result } = await store
        .dispatch(functionsApi.endpoints.invokeFunction.initiate({ name, body }))
        .unwrap();
      return { data: result as T, error: null };
    } catch (e: unknown) {
      const { message, status } = normalizeError(e);
      return { data: null, error: { message, status } };
    }
  },
};
