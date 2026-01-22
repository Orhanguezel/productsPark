// =============================================================
// FILE: src/pages/About.tsx
// FINAL — About Page (dynamic from custom_pages, minimal repetition)
// - Uses CustomPageView from integrations/types
// - GlobalSeo is handled in App.tsx
// - Route-level SEO: meta_title/meta_description + canonical (no fallbacks)
// - About “content” is JSON in CustomPageView.content (string), parse safely
// - Image uses data.image_url (URL) NOT data.image_asset_id (id)
// =============================================================

import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

import { Card, CardContent } from '@/components/ui/card';

import { Shield, Zap, HeadphonesIcon, Award, Users, Target, type LucideIcon } from 'lucide-react';

import type { CustomPageView, PageState, AboutPageContent } from '@/integrations/types';
import { nonEmpty, imgSrc, getOrigin, hasText, safeParseJson } from '@/integrations/types';

import { useGetCustomPageBySlugQuery } from '@/integrations/hooks';


const iconMap: Record<string, LucideIcon> = {
  shield: Shield,
  zap: Zap,
  headphones: HeadphonesIcon,
  award: Award,
  users: Users,
  target: Target,
};

function usePageState(args: { isLoading: boolean; isError: boolean; hasData: boolean }): PageState {
  const { isLoading, isError, hasData } = args;
  return useMemo(() => {
    if (isLoading) return 'loading';
    if (isError) return 'error';
    if (!hasData) return 'empty';
    return 'ready';
  }, [isLoading, isError, hasData]);
}

export default function About() {
  const slug = 'hakkimizda';

  const { data, isLoading, isError } = useGetCustomPageBySlugQuery({ slug });

  const pageState = usePageState({ isLoading, isError, hasData: !!data });

  const canonicalUrl = useMemo(() => {
    const origin = getOrigin();
    return origin ? `${origin}/${slug}` : '';
  }, [slug]);

  const metaTitle = nonEmpty(data?.meta_title);
  const metaDesc = nonEmpty(data?.meta_description);

  // data is CustomPageView; its "content" is a string (HTML or JSON string). Here: JSON.
  const content = useMemo<AboutPageContent | null>(() => {
    return safeParseJson<AboutPageContent>(data?.content);
  }, [data?.content]);

  const heroKicker = nonEmpty(content?.hero_kicker);
  const heroTitle = nonEmpty(content?.hero_title);
  const heroLead = nonEmpty(content?.hero_lead);

  const storyTitle = nonEmpty(content?.story_title);
  const storyP1 = nonEmpty(content?.story_p1);
  const storyP2 = nonEmpty(content?.story_p2);
  const storyP3 = nonEmpty(content?.story_p3);

  const valuesTitle = nonEmpty(content?.values_title);
  const values = Array.isArray(content?.values) ? content!.values! : [];

  const stats = Array.isArray(content?.stats) ? content!.stats! : [];

  const missionTitle = nonEmpty(content?.mission_title);
  const missionText = nonEmpty(content?.mission_text);

  // ✅ IMPORTANT: image_url is the actual URL (normalizeCustomPage maps featured_image -> image_url)
  const featuredImage = imgSrc((data as CustomPageView | undefined)?.image_url);
  const featuredAlt =
    nonEmpty((data as CustomPageView | undefined)?.image_alt) || nonEmpty(data?.title);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Same pattern as Blog/Categories: canonical + optional title/description (no fallbacks) */}
      {canonicalUrl || metaTitle || metaDesc ? (
        <Helmet>
          {metaTitle ? <title>{metaTitle}</title> : null}
          {metaDesc ? <meta name="description" content={metaDesc} /> : null}
          {canonicalUrl ? <link rel="canonical" href={canonicalUrl} /> : null}
        </Helmet>
      ) : null}

      <Navbar />

      {/* HERO (only if provided; no static fallback) */}
      {heroKicker || heroTitle || heroLead ? (
        <section className="gradient-hero text-white py-16">
          <div className="container mx-auto px-4 text-center">
            {heroKicker ? <p className="text-primary-glow mb-4">{heroKicker}</p> : null}
            {heroTitle ? (
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{heroTitle}</h1>
            ) : null}
            {heroLead ? (
              <p className="text-xl text-white/80 max-w-2xl mx-auto">{heroLead}</p>
            ) : null}
          </div>
        </section>
      ) : null}

      {/* STATES */}
      {pageState === 'loading' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : null}

      {pageState === 'error' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Sayfa yüklenirken bir hata oluştu.</p>
        </div>
      ) : null}

      {pageState === 'empty' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Sayfa bulunamadı.</p>
        </div>
      ) : null}

      {pageState === 'ready' ? (
        <section className="py-12 flex-1">
          <div className="container mx-auto px-4">
            {/* STORY */}
            {storyTitle || storyP1 || storyP2 || storyP3 || featuredImage ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  {storyTitle ? <h2 className="text-3xl font-bold mb-6">{storyTitle}</h2> : null}
                  {storyP1 ? <p className="text-muted-foreground mb-4">{storyP1}</p> : null}
                  {storyP2 ? <p className="text-muted-foreground mb-4">{storyP2}</p> : null}
                  {storyP3 ? <p className="text-muted-foreground">{storyP3}</p> : null}
                </div>

                {featuredImage ? (
                  <div className="relative">
                    <img
                      src={featuredImage}
                      alt={featuredAlt}
                      className="rounded-lg shadow-elegant w-full h-auto"
                      loading="lazy"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* VALUES */}
            {valuesTitle && values.length ? (
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-center mb-12">{valuesTitle}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {values.map((v, idx) => {
                    const title = nonEmpty(v?.title);
                    const desc = nonEmpty(v?.text);
                    const key = nonEmpty(v?.icon);
                    const Icon = key && iconMap[key] ? iconMap[key] : null;

                    if (!title && !desc) return null;

                    return (
                      <Card
                        key={`${idx}-${title || 'value'}`}
                        className="text-center p-6 hover:shadow-elegant transition-all duration-300"
                      >
                        {Icon ? (
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon className="w-8 h-8 text-primary" />
                          </div>
                        ) : null}

                        {title ? <h3 className="text-xl font-bold mb-2">{title}</h3> : null}
                        {desc ? <p className="text-muted-foreground">{desc}</p> : null}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* STATS */}
            {stats.length ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                {stats.map((s, idx) => {
                  const value = nonEmpty(s?.value);
                  const label = nonEmpty(s?.label);
                  if (!value && !label) return null;

                  const variant = s?.variant;

                  const cls =
                    variant === 'secondary'
                      ? 'text-center p-8 bg-secondary'
                      : variant === 'accent'
                        ? 'text-center p-8 bg-accent text-accent-foreground'
                        : 'text-center p-8 gradient-primary text-white';

                  const valueCls =
                    variant === 'secondary'
                      ? 'text-4xl font-bold mb-2 text-primary'
                      : 'text-4xl font-bold mb-2';

                  const labelCls =
                    variant === 'secondary'
                      ? 'text-muted-foreground'
                      : variant === 'accent'
                        ? 'text-accent-foreground/80'
                        : 'text-white/90';

                  return (
                    <Card key={`${idx}-${value || 'stat'}`} className={cls}>
                      <div className={valueCls}>{value}</div>
                      <div className={labelCls}>{label}</div>
                    </Card>
                  );
                })}
              </div>
            ) : null}

            {/* MISSION */}
            {missionTitle || missionText ? (
              <Card className="p-8 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-0">
                  <div className="text-center max-w-3xl mx-auto">
                    {missionTitle ? (
                      <h2 className="text-3xl font-bold mb-4">{missionTitle}</h2>
                    ) : null}
                    {hasText(missionText) ? (
                      <p className="text-lg text-muted-foreground">{missionText}</p>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}
