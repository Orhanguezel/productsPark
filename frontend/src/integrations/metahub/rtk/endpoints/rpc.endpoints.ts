// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/endpoints/rpc.endpoints.ts
// -------------------------------------------------------------
import { baseApi } from "../baseApi";

type UnknownRecord = Record<string, unknown>;

const extractData = (res: unknown): unknown => {
  if (res && typeof res === "object") {
    const r = res as Record<string, unknown>;
    return Object.prototype.hasOwnProperty.call(r, "data") ? r.data : res;
  }
  return res;
};

export const rpcApi = baseApi.injectEndpoints({
  endpoints: (b) => ({
    callRpc: b.mutation<{ result: unknown }, { name: string; args?: unknown }>({
      query: ({ name, args }) => ({
        url: `/rest/v1/rpc/${encodeURIComponent(name)}`,
        method: "POST",
        body: args ?? {},
      }),
      transformResponse: (res: unknown): { result: unknown } => ({
        result: extractData(res),
      }),
      invalidatesTags: ["RPC"],
    }),
  }),
  overrideExisting: true,
});

export const { useCallRpcMutation } = rpcApi;
