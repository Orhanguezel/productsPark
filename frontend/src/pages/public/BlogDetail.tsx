// =============================================================
// FILE: src/pages/BlogDetail.tsx (veya senin kullandığın path)
// =============================================================

import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Calendar,
  User,
  Clock,
  Share2,
  Facebook,
  Twitter,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";

import {
  useGetBlogPostBySlugQuery,
  useListBlogPostsQuery,
} from "@/integrations/metahub/rtk/endpoints/blog_posts.endpoints";
import type { BlogPost as BlogPostType } from "@/integrations/metahub/rtk/types/blog";

const fallbackImage =
  "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop";

const BlogDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // 🔹 Ana yazı: slug ile getir
  const {
    data: post,
    isLoading: postLoading,
    isError: postError,
  } = useGetBlogPostBySlugQuery(slug ?? "", {
    skip: !slug,
  });

  // 🔹 İlgili yazılar için liste (yayında olanlar, son yazılar)
  const {
    data: relatedData = [],
    isLoading: relatedLoading,
  } = useListBlogPostsQuery(
    {
      is_published: true,
      sort: "created_at",
      order: "desc",
      limit: 6,
    },
    {
      skip: !slug,
    }
  );

  // 🔹 İlgili yazılar: aynı kategoriden, kendisini hariç tut, max 3
  const relatedPosts: BlogPostType[] =
    post == null
      ? []
      : relatedData
          .filter((p) => p.slug !== post.slug)
          .filter((p) =>
            post.category
              ? p.category === post.category // aynı kategori varsa filtrele
              : true
          )
          .slice(0, 3);

  const loading = postLoading || (relatedLoading && !post);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = (platform: string) => {
    toast.success(`${platform} üzerinde paylaşılıyor...`);
  };

  // slug yoksa direkt 404 benzeri mesaj
  useEffect(() => {
    if (!slug) {
      // İstersen otomatik /blog'a yönlendirebilirsin
      // navigate("/blog");
    }
  }, [slug]);

  if (!slug) {
    return (
      <div className="min-h-screen flex flex-col">
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

  if (postError || !post) {
    return (
      <div className="min-h-screen flex flex-col">
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
      <Navbar />

      <article className="py-12 flex-1">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Breadcrumb */}
          <div className="text-sm text-muted-foreground mb-6">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="hover:text-primary"
            >
              Ana Sayfa
            </button>
            {" / "}
            <button
              type="button"
              onClick={() => navigate("/blog")}
              className="hover:text-primary"
            >
              Blog
            </button>
            {" / "}
            <span className="text-foreground">
              {post.category ?? "Genel"}
            </span>
          </div>

          {/* Başlık / meta */}
          <div className="mb-8">
            <Badge className="mb-4">{post.category ?? "Genel"}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author_name ?? "Admin"}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(post.published_at || post.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.read_time ?? "Okuma süresi"}
              </div>
            </div>
          </div>

          {/* Kapak görseli */}
          <div className="mb-8 rounded-lg overflow-hidden shadow-card">
            <img
              src={post.image_url || fallbackImage}
              alt={post.title}
              className="w-full aspect-video object-cover"
            />
          </div>

          {/* Paylaş butonları */}
          <Card className="mb-8 p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className="font-semibold flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                Paylaş
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("Facebook")}
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("Twitter")}
                >
                  <Twitter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleShare("LinkedIn")}
                >
                  <Linkedin className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* İçerik */}
          <div
            className="prose prose-lg max-w-none mb-12 dark:prose-invert"
            dangerouslySetInnerHTML={{ __html: post.content ?? "" }}
          />

          <Separator className="my-12" />

          {/* İlgili Yazılar */}
          {relatedPosts.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-6">İlgili Yazılar</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedPosts.map((relatedPost) => (
                  <Card
                    key={relatedPost.id}
                    className="group overflow-hidden cursor-pointer hover:shadow-elegant transition-all duration-300"
                    onClick={() => navigate(`/blog/${relatedPost.slug}`)}
                  >
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={
                          relatedPost.image_url ||
                          "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop"
                        }
                        alt={relatedPost.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    <CardContent className="p-4">
                      <Badge className="mb-2" variant="secondary">
                        {relatedPost.category ?? "Genel"}
                      </Badge>
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {relatedPost.title}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogDetail;
