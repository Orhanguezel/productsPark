// src/integrations/metahub/core/errors.ts

import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { SerializedError } from "@reduxjs/toolkit";

type MaybeMessage = { message?: unknown };
type MaybeError = { error?: unknown };
type MaybeStatus = { status?: unknown };
type MaybeData = { data?: unknown };

export function normalizeError(err: unknown): { message: string; status?: number } {
  // RTK FetchBaseQueryError şekli: { status, data? }
  if (isObject(err) && "status" in err) {
    const statusRaw = (err as MaybeStatus).status;
    const status = typeof statusRaw === "number" ? statusRaw : undefined;

    const data = (err as MaybeData).data;
    if (isObject(data) && "message" in data) {
      const m = (data as MaybeMessage).message;
      if (typeof m === "string") return { message: m, status };
    }

    const e = (err as MaybeError).error;
    if (typeof e === "string") return { message: e, status };

    return { message: "request_failed", status };
  }

  // SerializedError: { message?, name?, stack? }
  if (isObject(err) && "message" in err) {
    const m = (err as MaybeMessage).message;
    if (typeof m === "string") return { message: m };
  }

  if (err instanceof Error) return { message: err.message };
  return { message: "unknown_error" };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

// Yardımcı tip (istersen dışa açabilirsin)
export type RTKError = FetchBaseQueryError | SerializedError | Record<string, unknown>;
