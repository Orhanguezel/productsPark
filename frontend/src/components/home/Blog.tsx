// FILE: src/components/home/Blog.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import type {
  BlogPost,
  SiteSetting,
} from "@/integrations/types";
import {
  useListBlogPostsQuery,
  useListSiteSettingsQuery,
} from "@/integrations/hooks";


const DEFAULT_SETTINGS = {
  home_blog_badge: "Blog Yazılarımız",
  home_blog_title: "Güncel İçerikler",
  home_blog_subtitle:
    "Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler",
  home_blog_button: "Tüm Blog Yazıları",
};

type BlogSettings = typeof DEFAULT_SETTINGS;

const Blog = () => {
  const navigate = useNavigate();

  /* --------- Site settings (RTK) --------- */

  const { data: settingsList, isLoading: isSettingsLoading } =
    useListSiteSettingsQuery({ prefix: "home_blog_" });

  const [settings, setSettings] = useState<BlogSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    if (!settingsList) return;

    setSettings((prev) => {
      const next: BlogSettings = { ...prev };
      const dict: Record<string, SiteSetting["value"]> = {};

      for (const item of settingsList) {
        dict[item.key] = item.value;
      }

      // Sadece string olanları al
      (Object.keys(next) as Array<keyof BlogSettings>).forEach((key) => {
        const raw = dict[key];
        if (typeof raw === "string") {
          next[key] = raw;
        }
      });

      return next;
    });
  }, [settingsList]);

  /* --------- Blog posts (RTK) --------- */

  const {
    data: posts = [],
    isLoading: isPostsLoading,
  } = useListBlogPostsQuery({
    is_published: true,
    limit: 4,
    sort: "published_at",
    order: "desc",
  });

  const loading = isSettingsLoading || isPostsLoading;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading || posts.length === 0) return null;

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <Badge variant="secondary" className="mb-4">
            {settings.home_blog_badge}
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {settings.home_blog_title}
          </h2>
          <p className="text-lg text-muted-foreground">
            {settings.home_blog_subtitle}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {posts.map((post: BlogPost) => (
            <Card
              key={post.id}
              className="group overflow-hidden hover:shadow-elegant transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={
                    post.image_url ||
                    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop"
                  }
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                {post.category && (
                  <Badge className="absolute top-4 left-4" variant="secondary">
                    {post.category}
                  </Badge>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{formatDate(post.published_at ?? post.created_at)}</span>
                  <span>•</span>
                  <span>{post.read_time ?? "1 dk"}</span>
                </div>
                <h3 className="font-semibold group-hover:text-primary transition-colors mb-2 line-clamp-2">
                  {post.title}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {post.excerpt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/blog")}
          >
            {settings.home_blog_button}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Blog;
