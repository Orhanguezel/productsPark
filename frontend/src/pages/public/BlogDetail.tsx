// =============================================================
// FILE: src/pages/BlogDetail.tsx
// FINAL — Blog Detail Page (SEO via SeoHelmet, no duplicates)
// - Canonical/hreflang: RouteSeoLinks (global)
// - Global defaults: GlobalSeo (global)
// - Route SEO: SeoHelmet only
// - No fallback image URLs: og:image emitted only if post.image_url exists
// - robots: noindex when unpublished
// =============================================================

import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SeoHelmet from '@/seo/SeoHelmet';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

import { Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin } from 'lucide-react';
import { toast } from 'sonner';

import { useGetBlogPostBySlugQuery, useListBlogPostsQuery } from '@/integrations/hooks';
import type { BlogPost as BlogPostType } from '@/integrations/types';
import { getOrigin, hasText, nonEmpty } from '@/integrations/types';
import { stripHtmlToText, truncateText } from '@/integrations/types';

type SeoMetaItem = { name?: string; property?: string; content: string };

const BlogDetail: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();

  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
    error,
  } = useGetBlogPostBySlugQuery(slug ?? '', { skip: !slug });

  const { data: relatedData = [], isLoading: relatedLoading } = useListBlogPostsQuery(
    { is_published: true, sort: 'created_at', order: 'desc', limit: 6 },
    { skip: !slug },
  );

  const notFound = postError && (error as { status?: unknown } | null)?.status === 404;

  const loading = postLoading || (relatedLoading && !post);

  const relatedPosts: BlogPostType[] = useMemo(() => {
    if (!post) return [];
    return relatedData
      .filter((p) => p.slug !== post.slug)
      .filter((p) => (post.category ? p.category === post.category : true))
      .slice(0, 3);
  }, [relatedData, post]);

  const origin = useMemo(() => getOrigin(), []);
  const url = useMemo(() => {
    if (!origin) return '';
    return slug ? `${origin}/blog/${slug}` : `${origin}/blog`;
  }, [origin, slug]);

  const seoTitle = useMemo(() => {
    return nonEmpty(post?.meta_title) || nonEmpty(post?.title) || '';
  }, [post?.meta_title, post?.title]);

  const seoDesc = useMemo(() => {
    const d = nonEmpty(post?.meta_description);
    if (d) return d;

    const ex = nonEmpty(post?.excerpt);
    if (ex) return truncateText(ex, 160);

    const contentText = stripHtmlToText(post?.content || '');
    return contentText ? truncateText(contentText, 160) : '';
  }, [post?.meta_description, post?.excerpt, post?.content]);

  const ogImage = useMemo(() => nonEmpty(post?.image_url) || '', [post?.image_url]);

  const robots = useMemo(() => {
    // Published değilse indexleme kapat (admin preview vs.)
    if (!post) return null;
    return post.is_published ? null : 'noindex,nofollow';
  }, [post]);

  const extraMeta: SeoMetaItem[] = useMemo(() => {
    if (!post) return [];

    const items: SeoMetaItem[] = [];

    if (post.published_at) {
      const iso = new Date(post.published_at).toISOString();
      items.push({ property: 'article:published_time', content: iso });
    }

    if (post.updated_at) {
      const iso = new Date(post.updated_at).toISOString();
      items.push({ property: 'article:modified_time', content: iso });
    }

    if (hasText(post.author_name)) {
      items.push({ property: 'article:author', content: post.author_name! });
    }

    if (hasText(post.category)) {
      items.push({ property: 'article:section', content: post.category! });
    }

    return items;
  }, [post]);

  const formatDateTRLocal = (dateString: string | null | undefined) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleShare = (platform: string) => {
    toast.success(`${platform} üzerinde paylaşılıyor...`);
  };

  if (!slug) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoHelmet title="Geçersiz blog adresi" robots="noindex,follow" />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Geçersiz blog adresi.</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen flex flex-col">
        <SeoHelmet title="Blog yazısı bulunamadı" robots="noindex,follow" />
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground">Blog yazısı bulunamadı.</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHelmet
        title={seoTitle || null}
        description={seoDesc || null}
        ogType="article"
        url={url || null}
        imageUrl={ogImage || null}
        robots={robots}
        meta={extraMeta}
      />

      <Navbar />

      <article className="py-12 flex-1">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-sm text-muted-foreground mb-6">
            <button type="button" onClick={() => navigate('/')} className="hover:text-primary">
              Ana Sayfa
            </button>
            {' / '}
            <button type="button" onClick={() => navigate('/blog')} className="hover:text-primary">
              Blog
            </button>
            {' / '}
            <span className="text-foreground">{post.category ?? 'Genel'}</span>
          </div>

          <div className="mb-8">
            <Badge className="mb-4">{post.category ?? 'Genel'}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">{post.title}</h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author_name ?? 'Admin'}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDateTRLocal(post.published_at || post.created_at)}
              </div>
              {hasText(post.read_time) ? (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {post.read_time}
                </div>
              ) : null}
            </div>
          </div>

          {/* No fallback image: only render if provided */}
          {ogImage ? (
            <div className="mb-8 rounded-lg overflow-hidden shadow-card">
              <img
                src={ogImage}
                alt={post.image_alt || post.title}
                className="w-full aspect-video object-cover"
                loading="lazy"
              />
            </div>
          ) : null}

          <Card className="mb-8 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="font-semibold flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Paylaş
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={() => handleShare('Facebook')}>
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleShare('Twitter')}>
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => handleShare('LinkedIn')}>
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          <div
            className="prose prose-lg max-w-none mb-12 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content ?? '' }}
          />

          <Separator className="my-12" />

          {relatedPosts.length > 0 ? (
            <div>
              <h2 className="text-3xl font-bold mb-6">İlgili Yazılar</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((rp) => {
                  const rpImage = nonEmpty(rp.image_url);

                  return (
                    <Card
                      key={rp.id}
                      className="group overflow-hidden cursor-pointer hover:shadow-elegant transition-all duration-300"
                      onClick={() => navigate(`/blog/${rp.slug}`)}
                      role="button"
                    >
                      {/* No fallback image */}
                      {rpImage ? (
                        <div className="relative overflow-hidden aspect-video">
                          <img
                            src={rpImage}
                            alt={rp.image_alt || rp.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        </div>
                      ) : null}

                      <CardContent className="p-4">
                        <Badge className="mb-2" variant="secondary">
                          {rp.category ?? 'Genel'}
                        </Badge>
                        <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {rp.title}
                        </h3>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogDetail;
