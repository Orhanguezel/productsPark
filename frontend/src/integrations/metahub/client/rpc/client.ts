import { store } from "@/store";
import { rpcApi } from "@/integrations/metahub/rtk/endpoints/rpc.endpoints";
import { normalizeError } from "@/integrations/metahub/core/errors";

type RpcReturn<T = unknown> = Promise<{ data: T | null; error: { message: string; status?: number } | null }>;

async function callImpl<T = unknown>(name: string, args?: unknown): RpcReturn<T> {
  try {
    const { result } = await store
      .dispatch(rpcApi.endpoints.callRpc.initiate({ name, args }))
      .unwrap();
    return { data: result as T, error: null };
  } catch (e) {
    const { message, status } = normalizeError(e);
    return { data: null, error: { message, status } };
  }
}

/** Supabase-uyumlu imza: metahub.rpc('exec_sql', { sql: '...' }) */
export interface RpcFacade {
  (name: string, args?: unknown): RpcReturn;
  call<T = unknown>(name: string, args?: unknown): RpcReturn<T>;
  exec<T = unknown>(name: string, args?: unknown): RpcReturn<T>;
  invoke<T = unknown>(name: string, args?: unknown): RpcReturn<T>;
}

export const rpc: RpcFacade = ((name: string, args?: unknown) => callImpl(name, args)) as RpcFacade;
rpc.call = callImpl;
rpc.exec = callImpl;
rpc.invoke = callImpl;
