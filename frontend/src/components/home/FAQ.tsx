// =============================================================
// FILE: src/components/home/FAQ.tsx
// FINAL — Home FAQ
// - FAQ items: DB via RTK (no category filter; active=true)
// - Header/CTA texts: site_settings via useSeoSettings (keys: home_faq_*)
// - Handles API shapes: array | {items} | {data} | {rows} | {result}
// - Renders only when FAQs exist (no fallback content)
// =============================================================

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';

import type { Faq } from '@/integrations/types';
import { toStr } from '@/integrations/types';
import { useListFaqsQuery } from '@/integrations/hooks';

import { useSeoSettings } from '@/hooks/useSeoSettings';

type AnyFaqListResponse =
  | Faq[]
  | { items?: Faq[]; data?: Faq[]; rows?: Faq[]; result?: Faq[] }
  | undefined
  | null;

function pickFaqRows(resp: AnyFaqListResponse): Faq[] {
  if (!resp) return [];
  if (Array.isArray(resp)) return resp;
  const candidates = [resp.items, resp.data, resp.rows, resp.result];
  for (const c of candidates) if (Array.isArray(c)) return c;
  return [];
}


const FAQ: React.FC = () => {
  // ✅ site_settings texts
  const { settings } = useSeoSettings(); // seoOnly: false olmalı

  const title = toStr((settings as any)?.home_faq_title).trim() || 'Sıkça Sorulan Sorular';
  const subtitle =
    toStr((settings as any)?.home_faq_subtitle).trim() ||
    'Merak ettiklerinizin cevaplarını burada bulabilirsiniz';

  const ctaTitle = toStr((settings as any)?.home_faq_cta_title).trim();
  const ctaSubtitle = toStr((settings as any)?.home_faq_cta_subtitle).trim();
  const ctaButton = toStr((settings as any)?.home_faq_cta_button).trim() || 'Bize Ulaşın →';

  // ✅ FAQs from DB (category yok)
  const { data, isLoading, isFetching, isError, error } = useListFaqsQuery({
    orderBy: 'display_order',
    order: 'asc',
    limit: 50,
    offset: 0,
    active: true,
  });

  const loading = isLoading || isFetching;

  const faqItems = useMemo(() => {
    const rows = pickFaqRows(data as AnyFaqListResponse);

    return rows
      .filter(
        (x) =>
          !!x &&
          typeof x.question === 'string' &&
          x.question.trim().length > 0 &&
          typeof x.answer === 'string' &&
          x.answer.trim().length > 0,
      )
      .map((row) => ({
        question: row.question.trim(),
        answer: row.answer,
      }));
  }, [data]);

  // ✅ FAQ yoksa hiç render etme
  if (!loading && faqItems.length === 0) return null;

  // ✅ Schema.org only when items exist
  const faqSchema =
    faqItems.length > 0
      ? {
          '@context': 'https://schema.org/',
          '@type': 'FAQPage',
          mainEntity: faqItems.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {faqSchema ? (
            <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
          ) : null}

          {/* Header */}
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            {subtitle ? <p className="mt-3 text-muted-foreground">{subtitle}</p> : null}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center text-muted-foreground">Yükleniyor...</div>
          ) : isError ? (
            <div className="text-center text-muted-foreground">
              SSS yüklenemedi.
              {(() => {
                if (typeof window !== 'undefined') {
                  console.error('FAQ load error:', error);
                }
                return null;
              })()}
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, index) => (
                <AccordionItem key={`${faq.question}-${index}`} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}

          {/* CTA */}
          {ctaTitle || ctaSubtitle || ctaButton ? (
            <div className="mt-10 rounded-lg border bg-background p-6 text-center">
              {ctaTitle ? <h3 className="text-xl font-semibold">{ctaTitle}</h3> : null}
              {ctaSubtitle ? <p className="mt-2 text-muted-foreground">{ctaSubtitle}</p> : null}

              <div className="mt-4">
                <Button asChild>
                  <Link to="/iletisim">{ctaButton}</Link>
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
