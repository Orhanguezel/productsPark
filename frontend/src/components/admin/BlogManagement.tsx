import { useEffect, useState } from "react";
import { metahub } from "@/integrations/metahub/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { Pencil, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author_name: string;
  image_url: string;
  read_time: string;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
}

type BlogFormData = Omit<BlogPost, "id" | "created_at">;

// basit TR destekli slugify
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

export const BlogManagement = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);

  // Kullanıcı slugu elle değiştirdiyse title değişince bir daha ezmeyelim
  const [slugTouched, setSlugTouched] = useState(false);

  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    author_name: "",
    image_url: "",
    read_time: "",
    is_published: false,
    is_featured: false,
  });

  // Tek bir helper: diğer tüm alanlar korunarak günceller
  const updateField = <K extends keyof BlogFormData>(
    key: K,
    value: BlogFormData[K],
  ) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await metahub
        .from("blog_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error("Error fetching blog posts:", error);
      toast({
        title: "Hata",
        description: "Blog yazıları yüklenirken bir hata oluştu.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingPost) {
        const { error } = await metahub
          .from("blog_posts")
          .update(formData)
          .eq("id", editingPost.id);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Blog yazısı güncellendi." });
      } else {
        const { error } = await metahub.from("blog_posts").insert([formData]);

        if (error) throw error;
        toast({ title: "Başarılı", description: "Blog yazısı oluşturuldu." });
      }

      setDialogOpen(false);
      resetForm();
      fetchPosts();
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Hata",
        description: "Blog yazısı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinizden emin misiniz?")) return;

    try {
      const { error } = await metahub.from("blog_posts").delete().eq("id", id);

      if (error) throw error;
      toast({ title: "Başarılı", description: "Blog yazısı silindi." });
      fetchPosts();
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Hata",
        description: "Blog yazısı silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setSlugTouched(false); // mevcut slug’ı yazıyla otomatik bozmayalım

    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      category: post.category,
      author_name: post.author_name,
      image_url: post.image_url || "",
      read_time: post.read_time || "",
      is_published: post.is_published,
      is_featured: post.is_featured,
    });

    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingPost(null);
    setSlugTouched(false);
    setFormData({
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "",
      author_name: "",
      image_url: "",
      read_time: "",
      is_published: false,
      is_featured: false,
    });
  };

  const handleNewPost = () => {
    resetForm();
    setDialogOpen(true);
  };

  if (loading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Blog Yazıları</h3>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewPost} className="gradient-primary">
              <Plus className="w-4 h-4 mr-2" />
              Yeni Blog Yazısı
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPost ? "Blog Yazısını Düzenle" : "Yeni Blog Yazısı"}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Başlık + slug */}
              <div>
                <Label htmlFor="title">Başlık</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      title: value,
                      // kullanıcı sluga elle dokunmadıysa otomatik üret
                      slug:
                        prev.slug && (slugTouched || editingPost)
                          ? prev.slug
                          : slugify(value),
                    }));
                  }}
                  required
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug (URL)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    updateField("slug", e.target.value);
                  }}
                  required
                />
              </div>

              {/* Özet */}
              <div>
                <Label htmlFor="excerpt">Özet</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => updateField("excerpt", e.target.value)}
                  rows={2}
                />
              </div>

              {/* İçerik (HTML) - zengin editör burada */}
              <div>
                <Label htmlFor="content">İçerik (HTML)</Label>

                {/* Şu an Textarea; sen burada kendi HtmlEditor bileşenini de kullanabilirsin.
                   Önemli olan: KOŞULLU render etme; her zaman render olsun.
                */}
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => updateField("content", e.target.value)}
                  rows={10}
                  required
                />
              </div>

              {/* Kategori + yazar */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="author_name">Yazar Adı</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => updateField("author_name", e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Görsel + okuma süresi */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="image_url">Görsel URL</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => updateField("image_url", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="read_time">Okuma Süresi</Label>
                  <Input
                    id="read_time"
                    value={formData.read_time}
                    onChange={(e) => updateField("read_time", e.target.value)}
                    placeholder="5 dk"
                  />
                </div>
              </div>

              {/* Switchler */}
              <div className="flex items-center gap-6">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_published"
                    checked={formData.is_published}
                    onCheckedChange={(checked) =>
                      updateField("is_published", checked)
                    }
                  />
                  <Label htmlFor="is_published">Yayınla</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      updateField("is_featured", checked)
                    }
                  />
                  <Label htmlFor="is_featured">Öne Çıkan</Label>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  İptal
                </Button>
                <Button type="submit" className="gradient-primary">
                  {editingPost ? "Güncelle" : "Oluştur"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Başlık</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Yazar</TableHead>
            <TableHead>Durum</TableHead>
            <TableHead>Tarih</TableHead>
            <TableHead className="text-right">İşlemler</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {posts.map((post) => (
            <TableRow key={post.id}>
              <TableCell className="font-medium">{post.title}</TableCell>
              <TableCell>{post.category}</TableCell>
              <TableCell>{post.author_name}</TableCell>
              <TableCell>
                {post.is_published ? (
                  <span className="text-green-600">Yayında</span>
                ) : (
                  <span className="text-yellow-600">Taslak</span>
                )}
                {post.is_featured && (
                  <span className="ml-2 text-primary">★ Öne Çıkan</span>
                )}
              </TableCell>
              <TableCell>
                {new Date(post.created_at).toLocaleDateString("tr-TR")}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(post)}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(post.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
