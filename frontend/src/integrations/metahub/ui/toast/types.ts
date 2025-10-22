
// -------------------------------------------------------------
// FILE: src/integrations/metahub/ui/toast/types.ts
// -------------------------------------------------------------
export type ToastLevel = "success" | "info" | "warning" | "error";
export type ToastId = string;

export type Toast = {
  id: ToastId;
  level: ToastLevel;
  title?: string;
  message: string;
  detail?: string | null;
  durationMs?: number; // 0 → sticky
  createdAt: number;
};
