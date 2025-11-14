// 

import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { useNavigate } from "react-router-dom";
import { useSeoSettings } from "@/hooks/useSeoSettings";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  author_name: string;
  created_at: string;
  image_url: string;
  read_time: string;
  slug: string;
  is_featured: boolean;
}

const Blog = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [featuredPost, setFeaturedPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const { settings } = useSeoSettings();

  useEffect(() => {
    fetchBlogPosts();
  }, []);

  const fetchBlogPosts = async () => {
    try {
      const { data, error } = await metahub
        .from("blog_posts")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const featured = data.find(post => post.is_featured) || data[0];
        setFeaturedPost(featured);
        setPosts(data.filter(post => post.id !== featured.id));
      }
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

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{settings.seo_blog_title}</title>
        <meta name="description" content={settings.seo_blog_description} />
        <meta property="og:title" content={settings.seo_blog_title} />
        <meta property="og:description" content={settings.seo_blog_description} />
        <meta property="og:type" content="website" />
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="gradient-hero text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-primary-glow mb-4">— Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Haberler ve Rehberler
          </h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Dijital ürünler hakkında güncel bilgiler, ipuçları ve rehberler
          </p>
        </div>
      </section>

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <Card
              className="overflow-hidden cursor-pointer hover:shadow-elegant transition-all duration-300 mb-12"
              onClick={() => navigate(`/blog/${featuredPost.slug}`)}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-64 lg:h-auto">
                  <img
                    src={featuredPost.image_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop"}
                    alt={featuredPost.title}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Öne Çıkan
                  </Badge>
                </div>
                <CardContent className="p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-4" variant="secondary">
                    {featuredPost.category}
                  </Badge>
                  <h2 className="text-3xl font-bold mb-4 hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {featuredPost.author_name}
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(featuredPost.created_at)}
                    </div>
                    <span>{featuredPost.read_time} okuma</span>
                  </div>
                </CardContent>
              </div>
            </Card>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post) => (
                <Card
                  key={post.id}
                  className="group overflow-hidden cursor-pointer hover:shadow-elegant transition-all duration-300"
                  onClick={() => navigate(`/blog/${post.slug}`)}
                >
                  <CardHeader className="p-0">
                    <div className="relative overflow-hidden aspect-video">
                      <img
                        src={post.image_url || "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&h=400&fit=crop"}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Badge className="mb-3" variant="secondary">
                      {post.category}
                    </Badge>
                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {formatDate(post.created_at)}
                      </div>
                      <span>{post.read_time}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default Blog;