
// -------------------------------------------------------------
// FILE: src/integrations/metahub/ui/toast/helpers.ts
// -------------------------------------------------------------
import { store } from "@/store";
import { toastActions } from "@/integrations/metahub/ui/toastSlice";
import type { Toast, ToastLevel } from "./types";

const genId = () => `t_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` as const;

export type NotifyInput = { level: ToastLevel; message: string; title?: string; detail?: string | null; durationMs?: number };

export function notify(input: NotifyInput) {
  const id = genId();
  const t: Toast = { id, level: input.level, message: input.message, title: input.title, detail: input.detail ?? null, durationMs: input.durationMs ?? 3200, createdAt: Date.now() };
  store.dispatch(toastActions.push(t));
  if (t.durationMs && t.durationMs > 0) { window.setTimeout(() => store.dispatch(toastActions.remove(id)), t.durationMs + 50); }
  return { id } as const;
}

export const notifySuccess = (message: string, title?: string) => notify({ level: "success", message, title });
export const notifyInfo    = (message: string, title?: string) => notify({ level: "info", message, title });
export const notifyWarning = (message: string, title?: string) => notify({ level: "warning", message, title });
export const notifyError   = (message: string, title?: string, detail?: string | null) => notify({ level: "error", message, title, detail, durationMs: 6000 });
