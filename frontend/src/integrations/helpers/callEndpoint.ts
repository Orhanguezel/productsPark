// =============================================================
// FILE: src/integrations/metahub/rtk/helpers/callEndpoint.ts
// Amaç: store.dispatch(...) sonrası unwrap + finally unsubscribe/reset
// =============================================================
import type { SubscriptionOptions } from "@reduxjs/toolkit/query";
import { store } from "@/store";
import { normalizeError } from "@/integrations/core/errors";
import type { FetchResult } from "@/integrations/core/errors";

/** RTK Query initiate(...) dispatch sonucu: ihtiyacımız olan minimal arayüz */
export interface RTKSubscription<T> {
  unwrap: () => Promise<T>;
  unsubscribe?: () => void;
  reset?: () => void;
}

function hasMethod<T extends object, K extends PropertyKey>(
  obj: T | null | undefined,
  key: K
): obj is T & Record<K, (...args: never[]) => unknown> {
  return (
    !!obj &&
    typeof obj === "object" &&
    key in obj &&
    typeof (obj as Record<PropertyKey, unknown>)[key] === "function"
  );
}

/**
 * Kullanım:
 *   return callEndpoint(() =>
 *     (store.dispatch(api.endpoints.listX.initiate(params, { subscribe:false })) as unknown as RTKSubscription<Data>)
 *   );
 */
export async function callEndpoint<T>(
  run: () => RTKSubscription<T>
): Promise<FetchResult<T>> {
  const sub = run();
  try {
    const data = await sub.unwrap();
    return { data, error: null };
  } catch (e) {
    return { data: null, error: normalizeError(e) };
  } finally {
    if (hasMethod(sub, "unsubscribe")) sub.unsubscribe();
    if (hasMethod(sub, "reset")) sub.reset();
  }
}

/**
 * İsteğe bağlı yardımcı: endpoint + arg ver, dispatch + unwrap’ı biz yapalım.
 * RTK’nin karmaşık iç tiplerine dokunmadan unknown→daraltma ile ilerliyoruz.
 */
export async function callQuery<TArg, TData>(
  init: (arg: TArg, opts?: SubscriptionOptions) => unknown,
  arg: TArg,
  opts?: SubscriptionOptions
): Promise<FetchResult<TData>> {
  return callEndpoint<TData>(() => {
    const action = init(arg, opts) as unknown;
    const dispatchUnknown = store.dispatch as unknown as (a: unknown) => unknown;
    const sub = dispatchUnknown(action) as unknown as RTKSubscription<TData>;
    return sub;
  });
}
