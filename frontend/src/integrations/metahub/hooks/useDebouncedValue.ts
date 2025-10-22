
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/useDebouncedValue.ts
// -------------------------------------------------------------
import { useEffect, useRef, useState } from "react";

export function useDebouncedValue<T>(value: T, ms = 300) {
  const [v, setV] = useState(value);
  const t = useRef<number | null>(null);
  useEffect(() => {
    if (t.current) window.clearTimeout(t.current);
    t.current = window.setTimeout(() => setV(value), ms);
    return () => { if (t.current) window.clearTimeout(t.current); };
  }, [value, ms]);
  return v;
}
