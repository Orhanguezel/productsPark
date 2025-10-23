// =============================================================
// FILE: src/integrations/metahub/rtk/helpers/callEndpoint.ts
// Amaç: store.dispatch(...) sonrası unwrap + finally unsubscribe/reset
// =============================================================
import type {
  QueryActionCreatorResult,
  MutationActionCreatorResult,
  SubscriptionOptions,
} from "@reduxjs/toolkit/query";
import { store } from "@/store";
import { normalizeError } from "@/integrations/metahub/core/errors";
import type { FetchResult } from "@/integrations/metahub/core/errors";

// Hem query hem mutation sonucu için ortak tür
type AnyActionResult<T> = QueryActionCreatorResult<T> | MutationActionCreatorResult<T>;

function hasMethod<T extends object, K extends PropertyKey>(
  obj: T | null | undefined,
  key: K
): obj is T & Record<K, (...args: never[]) => unknown> {
  return !!obj && typeof obj === "object" && key in obj && typeof (obj as Record<PropertyKey, unknown>)[key] === "function";
}

/**
 * Kullanım:
 *   return callEndpoint(() =>
 *     store.dispatch(api.endpoints.listX.initiate(params, { subscribe: false }))
 *   );
 *
 * Not: subscribe:false → UI'ye abonelik açmaz; yine de finally'de unsubscribe/reset çalışır.
 */
export async function callEndpoint<T>(
  run: () => AnyActionResult<T>
): Promise<FetchResult<T>> {
  const sub = run();
  try {
    const data = (await sub.unwrap()) as T;
    return { data, error: null };
  } catch (e) {
    const err = normalizeError(e);
    return { data: null, error: err };
  } finally {
    // Query'lerde unsubscribe, mutation'larda reset mevcut olabilir.
    if (hasMethod(sub, "unsubscribe")) sub.unsubscribe();
    if (hasMethod(sub, "reset")) sub.reset();
  }
}

/**
 * Opsiyonel yardımcı: endpoint + arg ver, factory'yi biz kurup çağırırız.
 * Tip güvenliği için TData'yı explicit geçiriyoruz.
 */
export async function callQuery<TArg, TData>(
  init: (arg: TArg, opts?: SubscriptionOptions) => unknown, // initiate(...) thunk'ı
  arg: TArg,
  opts?: SubscriptionOptions
): Promise<FetchResult<TData>> {
  return callEndpoint<TData>(() =>
    store.dispatch(init(arg, opts) as unknown as AnyActionResult<TData>) // no-any: unknown→daraltma
  );
}
