// =============================================================
// FILE: src/pages/Blog.tsx
// FINAL — Blog List Page (SEO via SeoHelmet, no duplicates)
// - Canonical/hreflang: RouteSeoLinks (global)
// - Global defaults: GlobalSeo (global)
// - Route SEO: SeoHelmet only
// - No fallback images
// =============================================================

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeoHelmet from '@/components/seo/SeoHelmet';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, User } from 'lucide-react';

import { useSeoSettings } from '@/hooks/useSeoSettings';
import { useListBlogPostsQuery } from '@/integrations/hooks';
import type { PageState } from '@/integrations/types';
import {
  hasText,
  nonEmpty,
  imgSrc,
  formatDateTR,
  pickFeatured,
  getOrigin,
} from '@/integrations/types';

const Blog: React.FC = () => {
  const navigate = useNavigate();

  // SEO keys are still coming from site_settings (fallbacks live inside useSeoSettings only if you want them).
  // Here we explicitly use "no fallbacks" pattern via nonEmpty().
  const { flat, loading: seoLoading } = useSeoSettings({ seoOnly: true });

  const {
    data: allPosts = [],
    isLoading,
    isError,
  } = useListBlogPostsQuery({
    is_published: true,
    sort: 'created_at',
    order: 'desc',
  });

  const featuredPost = useMemo(() => pickFeatured(allPosts), [allPosts]);

  const posts = useMemo(() => {
    if (!featuredPost) return allPosts;
    return allPosts.filter((p) => p.id !== featuredPost.id);
  }, [allPosts, featuredPost]);

  const pageState: PageState = useMemo(() => {
    if (isLoading || seoLoading) return 'loading';
    if (isError) return 'error';
    if (!allPosts.length) return 'empty';
    return 'ready';
  }, [isLoading, seoLoading, isError, allPosts.length]);

  // Route-level SEO (no fallbacks)
  const seoTitle = nonEmpty(flat?.seo_blog_title);
  const seoDesc = nonEmpty(flat?.seo_blog_description);

  // og:url best-effort (canonical is global via RouteSeoLinks)
  const url = useMemo(() => {
    const origin = getOrigin();
    return origin ? `${origin}/blog` : '';
  }, []);

  const featuredImage = featuredPost ? imgSrc(featuredPost.image_url) : null;
  const featuredDate = featuredPost ? formatDateTR(featuredPost.created_at) : '';

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHelmet
        title={seoTitle || null}
        description={seoDesc || null}
        ogType="website"
        url={url || null}
        // Optional: list page OG image only if you want it.
        // If omitted, GlobalSeo’s og_default_image (if set) covers you globally.
        imageUrl={featuredImage || null}
      />

      <Navbar />

      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Haberler ve Rehberler</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Dijital ürünler hakkında güncel bilgiler, ipuçları ve rehberler
          </p>
        </div>
      </section>

      {pageState === 'loading' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      ) : null}

      {pageState === 'error' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Blog yazıları yüklenirken bir hata oluştu.</p>
        </div>
      ) : null}

      {pageState === 'empty' ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Şu anda görüntülenecek blog yazısı bulunamadı.</p>
        </div>
      ) : null}

      {pageState === 'ready' ? (
        <section className="py-12">
          <div className="container mx-auto px-4">
            {featuredPost ? (
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-elegant transition-all duration-300 mb-12"
                onClick={() => navigate(`/blog/${featuredPost.slug}`)}
                role="button"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2">
                  {featuredImage ? (
                    <div className="relative h-64 lg:h-auto">
                      <img
                        src={featuredImage}
                        alt={featuredPost.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                        Öne Çıkan
                      </Badge>
                    </div>
                  ) : null}

                  <CardContent className="p-8 flex flex-col justify-center">
                    {hasText(featuredPost.category) ? (
                      <Badge className="w-fit mb-4" variant="secondary">
                        {featuredPost.category}
                      </Badge>
                    ) : null}

                    <h2 className="text-3xl font-bold mb-4 hover:text-primary transition-colors">
                      {featuredPost.title}
                    </h2>

                    {hasText(featuredPost.excerpt) ? (
                      <p className="text-muted-foreground mb-6">{featuredPost.excerpt}</p>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                      {hasText(featuredPost.author_name) ? (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {featuredPost.author_name}
                        </div>
                      ) : null}

                      {featuredDate ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {featuredDate}
                        </div>
                      ) : null}

                      {hasText(featuredPost.read_time) ? (
                        <span>{featuredPost.read_time}</span>
                      ) : null}
                    </div>
                  </CardContent>
                </div>
              </Card>
            ) : null}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => {
                const image = imgSrc(post.image_url);
                const date = formatDateTR(post.created_at);
                const readTime = nonEmpty(post.read_time);

                return (
                  <Card
                    key={post.id}
                    className="group overflow-hidden cursor-pointer hover:shadow-elegant transition-all duration-300"
                    onClick={() => navigate(`/blog/${post.slug}`)}
                    role="button"
                  >
                    {image ? (
                      <CardHeader className="p-0">
                        <div className="relative overflow-hidden aspect-video">
                          <img
                            src={image}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      </CardHeader>
                    ) : null}

                    <CardContent className="p-6">
                      {hasText(post.category) ? (
                        <Badge className="mb-3" variant="secondary">
                          {post.category}
                        </Badge>
                      ) : null}

                      <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                        {post.title}
                      </h3>

                      {hasText(post.excerpt) ? (
                        <p className="text-muted-foreground mb-4 line-clamp-3">{post.excerpt}</p>
                      ) : null}

                      {date || readTime ? (
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          {date ? (
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {date}
                            </div>
                          ) : null}
                          {readTime ? <span>{readTime}</span> : null}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  );
};

export default Blog;
