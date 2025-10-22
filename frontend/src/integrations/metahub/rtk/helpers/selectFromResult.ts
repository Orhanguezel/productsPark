
// -------------------------------------------------------------
// FILE: src/integrations/metahub/rtk/helpers/selectFromResult.ts
// -------------------------------------------------------------
export function pick<T extends object, K extends keyof T>(obj: T, keys: readonly K[]): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const k of keys) (out as Record<string, unknown>)[k as string] = obj[k];
  return out;
}