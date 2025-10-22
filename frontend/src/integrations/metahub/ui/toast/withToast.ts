
// -------------------------------------------------------------
// FILE: src/integrations/metahub/ui/toast/withToast.ts
// -------------------------------------------------------------
import { normalizeError } from "@/integrations/metahub/core/errors";
import { notifyError, notifySuccess } from "./helpers";

export async function withToast<T>(task: () => Promise<T>, messages: { success?: string; error?: string }): Promise<{ data: T | null; error: { message: string } | null }> {
  try {
    const data = await task();
    if (messages.success) notifySuccess(messages.success);
    return { data, error: null };
  } catch (e) {
    const { message } = normalizeError(e);
    notifyError(messages.error ?? "Bir hata oluştu", undefined, message);
    return { data: null, error: { message } };
  }
}