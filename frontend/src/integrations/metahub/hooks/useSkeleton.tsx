
// -------------------------------------------------------------
// FILE: src/integrations/metahub/hooks/useSkeleton.tsx
// -------------------------------------------------------------
import { useEffect, useState } from "react";

export function useSkeleton(minMs = 300) {
  const [show, setShow] = useState(true);
  useEffect(() => { const t = window.setTimeout(() => setShow(false), minMs); return () => window.clearTimeout(t); }, [minMs]);
  return show;
}

export function SkeletonTableRows({ rows = 10 }: { rows?: number }) {
  const r: number[] = Array.from({ length: rows }, (_, i) => i);
  return (
    <div className="animate-pulse">
      {r.map(i => (<div key={i} className="h-9 bg-gray-200/70 rounded mb-2" />))}
    </div>
  );
}
