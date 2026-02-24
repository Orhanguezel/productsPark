Belirtilen entity/modül için admin panel CRUD sayfaları oluştur: $ARGUMENTS

## ProductsPark Admin Panel Yapısı

Admin sayfaları: `frontend/src/pages/admin/`

### Dosya Yapısı

```
frontend/src/pages/admin/
├── [Entity]List.tsx        ← Listeleme sayfası
├── [Entity]Form.tsx        ← Oluşturma/düzenleme formu
├── [Entity]Detail.tsx      ← Detay sayfası (opsiyonel)
└── settings/
    └── components/
        └── [Entity]SettingsCard.tsx  ← Ayarlar bileşeni
```

### 1. Listeleme Sayfası Pattern

```typescript
// pages/admin/ProductList.tsx
'use client';

import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import {
  useListProductsAdminQuery,
  useDeleteProductAdminMutation,
} from '@/integrations/hooks';

export default function ProductListPage() {
  const [search, setSearch] = useState('');
  const { data: products, isLoading, refetch } = useListProductsAdminQuery();
  const [deleteProduct] = useDeleteProductAdminMutation();

  const filtered = products?.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm('Silmek istediğinize emin misiniz?')) return;
    try {
      await deleteProduct(id).unwrap();
      toast.success('Ürün silindi');
      refetch();
    } catch {
      toast.error('Silme işlemi başarısız');
    }
  };

  return (
    <AdminLayout title="Ürünler">
      <div className="flex justify-between items-center mb-4">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button asChild>
          <Link to="/admin/products/new">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ürün
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div>Yükleniyor...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>İsim</TableHead>
              <TableHead>Fiyat</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead className="text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered?.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.price} TL</TableCell>
                <TableCell>
                  <span className={product.is_active ? 'text-green-600' : 'text-red-600'}>
                    {product.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/admin/products/${product.id}`}>
                      <Edit className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </AdminLayout>
  );
}
```

### 2. Form Sayfası Pattern

```typescript
// pages/admin/ProductForm.tsx
'use client';

import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';
import { Save, ArrowLeft } from 'lucide-react';

import {
  useGetProductAdminByIdQuery,
  useCreateProductAdminMutation,
  useUpdateProductAdminMutation,
} from '@/integrations/hooks';

const formSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Fiyat 0 veya üzeri olmalı'),
  is_active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export default function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEdit = id && id !== 'new';

  const { data: product, isLoading } = useGetProductAdminByIdQuery(id!, { skip: !isEdit });
  const [createProduct, { isLoading: creating }] = useCreateProductAdminMutation();
  const [updateProduct, { isLoading: updating }] = useUpdateProductAdminMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      is_active: true,
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        description: product.description ?? '',
        price: product.price,
        is_active: product.is_active,
      });
    }
  }, [product, form]);

  const onSubmit = async (data: FormValues) => {
    try {
      if (isEdit) {
        await updateProduct({ id: id!, body: data }).unwrap();
        toast.success('Ürün güncellendi');
      } else {
        await createProduct(data).unwrap();
        toast.success('Ürün oluşturuldu');
      }
      navigate('/admin/products');
    } catch {
      toast.error('İşlem başarısız');
    }
  };

  if (isEdit && isLoading) {
    return <AdminLayout title="Ürün">Yükleniyor...</AdminLayout>;
  }

  return (
    <AdminLayout title={isEdit ? 'Ürün Düzenle' : 'Yeni Ürün'}>
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Geri
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>{isEdit ? product?.name : 'Yeni Ürün'}</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ürün Adı</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Açıklama</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fiyat (TL)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                  İptal
                </Button>
                <Button type="submit" disabled={creating || updating}>
                  <Save className="w-4 h-4 mr-2" />
                  {creating || updating ? 'Kaydediliyor...' : 'Kaydet'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
```

### 3. Routes Ekleme

```typescript
// routes/AppRoutes.tsx
<Route path="/admin/products" element={<ProductListPage />} />
<Route path="/admin/products/new" element={<ProductFormPage />} />
<Route path="/admin/products/:id" element={<ProductFormPage />} />
```

## Kontrol Listesi

- [ ] List sayfası: tablo, arama, silme
- [ ] Form sayfası: create/edit, validation
- [ ] RTK Query hooks kullanıldı
- [ ] Toast bildirimleri eklendi
- [ ] Loading state'ler handle edildi
- [ ] Route'lar AppRoutes.tsx'e eklendi
- [ ] AdminLayout wrapper kullanıldı
- [ ] Responsive tasarım
