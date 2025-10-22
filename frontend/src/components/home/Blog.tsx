import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image_url: string;
  category: string;
  created_at: string;
  slug: string;
  read_time: string;
}

const Blog = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    home_blog_badge: "Blog Yazılarımız",
    home_blog_title: "Güncel İçerikler",
    home_blog_subtitle: "Dijital ürünler, teknoloji ve güvenlik hakkında en güncel bilgiler",
    home_blog_button: "Tüm Blog Yazıları",
  });
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
    fetchBlogPosts();

    // Subscribe to real-time updates
    const channel = metahub
      .channel('blog-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = ['home_blog_badge', 'home_blog_title', 'home_blog_subtitle', 'home_blog_button'];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('Blog settings updated:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'site_settings'
        },
        (payload: any) => {
          const relevantKeys = ['home_blog_badge', 'home_blog_title', 'home_blog_subtitle', 'home_blog_button'];

          if (relevantKeys.includes(payload.new?.key)) {
            console.log('Blog settings inserted:', payload.new?.key);
            fetchSettings();
          }
        }
      )
      .subscribe();

    return () => {
      metahub.removeChannel(channel);
    };
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await metahub
        .from("site_settings")
        .select("*")
        .in("key", [
          "home_blog_badge",
          "home_blog_title",
          "home_blog_subtitle",
          "home_blog_button",
        ]);

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj = data.reduce((acc: any, item) => {
          acc[item.key] = item.value;
          return acc;
        }, {});

        setSettings((prev) => ({ ...prev, ...settingsObj }));
      }
    } catch (error) {
      console.error("Error fetching blog settings:", error);
    }
  };

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await metahub
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
    } finally {
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
          {posts.map((post) => (
            <Card
              key={post.id}
              className="group overflow-hidden hover:shadow-elegant transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/blog/${post.slug}`)}
            >
              <div className="relative overflow-hidden aspect-video">
                <img
                  src={post.image_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop"}
                  alt={post.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <Badge className="absolute top-4 left-4" variant="secondary">
                  {post.category}
                </Badge>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <span>{formatDate(post.created_at)}</span>
                  <span>•</span>
                  <span>{post.read_time}</span>
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
