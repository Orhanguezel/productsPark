

// -------------------------------------------------------------
// FILE: src/integrations/metahub/ui/errors/ErrorBoundary.tsx
// -------------------------------------------------------------
import React from "react";

type Props = { fallback?: React.ReactNode; children: React.ReactNode };

type State = { hasError: boolean; error: Error | null };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error): State { return { hasError: true, error }; }
  componentDidCatch(error: Error, info: React.ErrorInfo): void { if (import.meta.env.MODE !== "production") console.error(error, info); }
  reset = () => this.setState({ hasError: false, error: null });
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="p-4 rounded bg-red-50 text-red-700">
          <div className="font-semibold mb-2">Bir şeyler ters gitti.</div>
          <pre className="text-xs whitespace-pre-wrap">{this.state.error?.message}</pre>
          <button onClick={this.reset} className="mt-3 px-3 py-1 rounded bg-red-600 text-white">Tekrar dene</button>
        </div>
      );
    }
    return this.props.children;
  }
}
