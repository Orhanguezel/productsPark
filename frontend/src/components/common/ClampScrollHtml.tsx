// =============================================================
// FILE: src/components/common/ClampScrollHtml.tsx
// FINAL — single boxed description; auto height when short, scroll when long
// =============================================================

'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toStr } from '@/integrations/types';

type Props = {
  html?: string | null;
  className?: string;

  /** Max height; if content exceeds, scroll appears */
  maxHeight?: number;

  /** Optional heading */
  title?: string;

  /** Inner padding */
  paddingClassName?: string;
};

export function ClampScrollHtml({
  html,
  className,
  maxHeight = 360,
  title,
  paddingClassName = 'p-4',
}: Props) {
  const content = React.useMemo(() => toStr(html).trim(), [html]);
  if (!content) return null;

  return (
    <section className={cn('space-y-3', className)}>
      {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}

      <div className="rounded-md border bg-background/40">
        {/* ✅ Auto height; clamps at maxHeight; viewport scrolls */}
        <ScrollArea className="w-full" style={{ maxHeight }}>
          <div className={paddingClassName}>
            <div
              className="prose prose-invert max-w-none prose-a:text-primary break-words"
              dangerouslySetInnerHTML={{ __html: content }}
            />
          </div>
        </ScrollArea>
      </div>
    </section>
  );
}
