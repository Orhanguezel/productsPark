// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/helpers/mutationToast.ts
// -------------------------------------------------------------
import { normalizeError } from "@/integrations/metahub/core/errors";
import { notifyError, notifySuccess } from "@/integrations/metahub/ui/toast/helpers";

/**
 * RTK Query mutasyonlarını (veya herhangi bir async işlemi) toast ile sarmalayıp
 * tip güvenli şekilde çalıştırır. `runner` içinden ya bir RTK trigger'ın `.unwrap()`'ı
 * ya da `store.dispatch(api.endpoints.foo.initiate(...)).unwrap()` döndür.
 */
export async function runMutationWithToast<T>(
  runner: () => Promise<T>,
  opts: { success?: string; error?: string }
): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const data = await runner();
    if (opts.success) notifySuccess(opts.success);
    return { data, error: null };
  } catch (e) {
    const { message } = normalizeError(e);
    notifyError(opts.error ?? "İşlem başarısız", undefined, message);
    return { data: null, error: { message } };
  }
}
