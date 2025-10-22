
// -------------------------------------------------------------
// FILE: src/integrations/metahub/ui/errors/RetryButton.tsx
// -------------------------------------------------------------
import React from "react";

type Props = { onRetry: () => void; label?: string };
export function RetryButton({ onRetry, label = "Tekrar dene" }: Props) {
  return <button className="px-3 py-1 rounded border" onClick={onRetry}>{label}</button>;
}
