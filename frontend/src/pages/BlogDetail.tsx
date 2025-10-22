import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, User, Clock, Share2, Facebook, Twitter, Linkedin } from "lucide-react";
import { toast } from "sonner";
import { metahub } from "@/integrations/metahub/client";

interface BlogPost {
  id: string;
  title: string;
  content: string;
  category: string;
  author_name: string;
  created_at: string;
  image_url: string;
  read_time: string;
  slug: string;
  excerpt: string;
}

const BlogDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      fetchBlogPost();
    }
  }, [slug]);

  const fetchBlogPost = async () => {
    try {
      console.log("Fetching blog post with slug:", slug);
      const { data: postData, error: postError } = await metahub
        .from("blog_posts")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .maybeSingle();

      console.log("Post data:", postData, "Error:", postError);

      if (postError) throw postError;

      if (!postData) {
        console.log("No post found with slug:", slug);
        setPost(null);
        setLoading(false);
        return;
      }

      setPost(postData);

      const { data: relatedData, error: relatedError } = await metahub
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .neq("slug", slug)
        .limit(3)
        .order("created_at", { ascending: false });

      console.log("Related posts:", relatedData);
      if (relatedError) throw relatedError;
      setRelatedPosts(relatedData || []);
    } catch (error) {
      console.error("Error fetching blog post:", error);
      toast.error("Blog yazısı yüklenirken bir hata oluştu.");
    } finally {
      console.log("Setting loading to false");
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleShare = (platform: string) => {
    toast.success(`${platform} üzerinde paylaşılıyor...`);
  };

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

  if (!post) {
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
          <div className="text-sm text-muted-foreground mb-6">
            <a href="/" className="hover:text-primary">Ana Sayfa</a>
            {" / "}
            <a href="/blog" className="hover:text-primary">Blog</a>
            {" / "}
            <span className="text-foreground">{post.category}</span>
          </div>

          <div className="mb-8">
            <Badge className="mb-4">{post.category}</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              {post.title}
            </h1>
            <div className="flex items-center gap-6 text-muted-foreground">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {post.author_name}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {formatDate(post.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {post.read_time} okuma
              </div>
            </div>
          </div>

          <div className="mb-8 rounded-lg overflow-hidden shadow-card">
            <img
              src={post.image_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&h=600&fit=crop"}
              alt={post.title}
              className="w-full aspect-video object-cover"
            />
          </div>

          <Card className="mb-8 p-4">
            <div className="flex items-center justify-between">
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

          <div
            className="prose prose-lg max-w-none mb-12"
            dangerouslySetInnerHTML={{ __html: post.content }}
            style={{
              color: "var(--foreground)",
            }}
          />

          <Separator className="my-12" />

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
                      src={relatedPost.image_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=300&fit=crop"}
                      alt={relatedPost.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <CardContent className="p-4">
                    <Badge className="mb-2" variant="secondary">
                      {relatedPost.category}
                    </Badge>
                    <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {relatedPost.title}
                    </h3>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </article>

      <Footer />
    </div>
  );
};

export default BlogDetail;
