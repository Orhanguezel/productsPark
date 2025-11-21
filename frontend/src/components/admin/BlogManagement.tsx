// =============================================================
// FILE: src/pages/admin/blog/BlogManagement.tsx
// =============================================================
import { useState } from "react";
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

import type { BlogPost, UpsertBlogBody } from "@/integrations/metahub/rtk/types/blog";
import {
  useListBlogPostsAdminQuery,
  useCreateBlogPostAdminMutation,
  useUpdateBlogPostAdminMutation,
  useDeleteBlogPostAdminMutation,
} from "@/integrations/metahub/rtk/endpoints/admin/blog_admin.endpoints";

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

// Form state tipi (FE tarafı)
type BlogFormData = {
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
};

// Tek alan güncelleyen helper
const updateField =
  (setFormData: React.Dispatch<React.SetStateAction<BlogFormData>>) =>
    <K extends keyof BlogFormData>(key: K, value: BlogFormData[K]) => {
      setFormData((prev) => ({
        ...prev,
        [key]: value,
      }));
    };

// FE form datasını RTK body’ye map eden helper
const toUpsertBody = (form: BlogFormData): UpsertBlogBody => ({
  title: form.title,
  slug: form.slug,
  excerpt: form.excerpt || null,
  content: form.content || null,

  image_url: form.image_url || null,
  image_asset_id: null,
  image_alt: null,

  author_name: form.author_name || null,
  is_published: form.is_published,

  // legacy alanlar
  category: form.category || null,
  is_featured: form.is_featured,
  // display_order burada yok; ileride gerekirse eklenir
});

export const BlogManagement = () => {
  // Liste: RTK Query
  const {
    data: posts = [],
    isLoading: listLoading,
    isFetching: listFetching,
  } = useListBlogPostsAdminQuery({
    sort: "created_at",
    order: "desc",
  });

  const [createPost, { isLoading: creating }] =
    useCreateBlogPostAdminMutation();
  const [updatePost, { isLoading: updating }] =
    useUpdateBlogPostAdminMutation();
  const [deletePost, { isLoading: deleting }] =
    useDeleteBlogPostAdminMutation();

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

  const setField = updateField(setFormData);

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

  const handleEdit = (post: BlogPost) => {
    setEditingPost(post);
    setSlugTouched(false); // mevcut slug’ı yazıyla otomatik bozmayalım

    setFormData({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "",
      author_name: post.author_name || "",
      image_url: post.image_url || "",
      read_time: post.read_time || "",
      is_published: post.is_published,
      is_featured: post.is_featured ?? false,
    });

    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu blog yazısını silmek istediğinizden emin misiniz?")) return;

    try {
      await deletePost(id).unwrap();
      toast({ title: "Başarılı", description: "Blog yazısı silindi." });
    } catch (error) {
      console.error("Error deleting blog post:", error);
      toast({
        title: "Hata",
        description: "Blog yazısı silinirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const body = toUpsertBody(formData);

    try {
      if (editingPost) {
        await updatePost({ id: editingPost.id, body }).unwrap();
        toast({
          title: "Başarılı",
          description: "Blog yazısı güncellendi.",
        });
      } else {
        await createPost(body).unwrap();
        toast({
          title: "Başarılı",
          description: "Blog yazısı oluşturuldu.",
        });
      }

      setDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving blog post:", error);
      toast({
        title: "Hata",
        description: "Blog yazısı kaydedilirken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const globalLoading = listLoading || listFetching || creating || updating || deleting;

  if (globalLoading && posts.length === 0) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header + Dialog trigger */}
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
                    setField("slug", e.target.value);
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
                  onChange={(e) => setField("excerpt", e.target.value)}
                  rows={2}
                />
              </div>

              {/* İçerik (HTML) */}
              <div>
                <Label htmlFor="content">İçerik (HTML)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setField("content", e.target.value)}
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
                    onChange={(e) => setField("category", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="author_name">Yazar Adı</Label>
                  <Input
                    id="author_name"
                    value={formData.author_name}
                    onChange={(e) => setField("author_name", e.target.value)}
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
                    onChange={(e) => setField("image_url", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="read_time">Okuma Süresi</Label>
                  <Input
                    id="read_time"
                    value={formData.read_time}
                    onChange={(e) => setField("read_time", e.target.value)}
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
                      setField("is_published", checked)
                    }
                  />
                  <Label htmlFor="is_published">Yayınla</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) =>
                      setField("is_featured", checked)
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
                <Button
                  type="submit"
                  className="gradient-primary"
                  disabled={creating || updating}
                >
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
              <TableCell>{post.category ?? ""}</TableCell>
              <TableCell>{post.author_name ?? ""}</TableCell>
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
                {post.created_at
                  ? new Date(post.created_at).toLocaleDateString("tr-TR")
                  : "-"}
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

          {posts.length === 0 && !globalLoading && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm py-6">
                Henüz blog yazısı yok.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};
