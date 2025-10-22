// -------------------------------------------------------------
// FILE: src/integrations/metahub/perf/StrictMemo.tsx
// -------------------------------------------------------------
import React from "react";

export function StrictMemo<T>(Comp: React.ComponentType<T>) {
  return React.memo(Comp, (prev, next) => {
    const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
    for (const k of keys) { if ((prev as Record<string, unknown>)[k] !== (next as Record<string, unknown>)[k]) return false; }
    return true;
  });
}
