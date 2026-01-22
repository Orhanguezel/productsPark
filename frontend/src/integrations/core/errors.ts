// src/integrations/core/errors.ts (PATCH-FREE FINAL)

import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';

type MaybeMessage = { message?: unknown };
type MaybeError = { error?: unknown };
type MaybeStatus = { status?: unknown };
type MaybeData = { data?: unknown };

export type NormalizedError = { message: string; status?: number };

export function normalizeError(err: unknown): NormalizedError {
  if (isObject(err) && 'status' in err) {
    const statusRaw = (err as MaybeStatus).status;
    const status = typeof statusRaw === 'number' ? statusRaw : undefined;

    const data = (err as MaybeData).data;

    if (typeof data === 'string' && data.trim()) {
      return withStatus({ message: trimMsg(data) }, status);
    }

    if (isObject(data)) {
      // ✅ support { error: { message } }
      const nestedError = data['error'];
      if (isObject(nestedError)) {
        const nestedMsg = nestedError['message'];
        if (typeof nestedMsg === 'string' && nestedMsg.trim()) {
          return withStatus({ message: trimMsg(nestedMsg) }, status);
        }
      }

      const cand =
        pickStr(data, 'message') ??
        pickStr(data, 'error') ??
        pickStr(data, 'detail') ??
        pickStr(data, 'hint') ??
        pickStr(data, 'description') ??
        pickStr(data, 'msg');

      if (cand) return withStatus({ message: trimMsg(cand) }, status);

      try {
        return withStatus({ message: trimMsg(JSON.stringify(data)) }, status);
      } catch {
        // noop
      }
    }

    const e = (err as MaybeError).error;
    if (typeof e === 'string' && e.trim()) {
      return withStatus({ message: trimMsg(e) }, status);
    }

    return withStatus({ message: status ? `request_failed_${status}` : 'request_failed' }, status);
  }

  if (isObject(err) && 'message' in err) {
    const m = (err as MaybeMessage).message;
    if (typeof m === 'string' && m.trim()) return { message: trimMsg(m) };
  }

  if (err instanceof Error) return { message: trimMsg(err.message) };

  return { message: 'unknown_error' };
}

function withStatus(base: { message: string }, status?: number): NormalizedError {
  return typeof status === 'number' ? { ...base, status } : base;
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function pickStr(obj: Record<string, unknown>, key: string): string | null {
  const v = obj[key];
  return typeof v === 'string' && v.trim() ? v : null;
}

function trimMsg(s: string, max = 280): string {
  return s.length > max ? s.slice(0, max) + '…' : s;
}

export type FetchResult<T> = { data: T | null; error: NormalizedError | null };
export type RTKError = FetchBaseQueryError | SerializedError | Record<string, unknown>;
