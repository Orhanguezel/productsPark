// =============================================================
// FILE: src/pages/admin/CouponForm.tsx
// FINAL — Coupon create/update form (RTK + shadcn/ui)
// - exactOptionalPropertyTypes uyumlu
// - valid_from: her zaman string (YYYY-MM-DD)
// - valid_until: string | null (YYYY-MM-DD | null)
// - BE ISO -> UI date dönüşümleri güvenli
// =============================================================

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import {
  useGetCouponAdminByIdQuery,
  useCreateCouponAdminMutation,
  useUpdateCouponAdminMutation,
  useListCategoriesAdminQuery,
  useListProductsAdminQuery,
} from '@/integrations/hooks';

import type { Coupon, DiscountType, CreateCouponBody } from '@/integrations/types';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Scope = NonNullable<Coupon['applicable_to']>; // 'all' | 'category' | 'product'

type Category = { id: string; name: string };
type Product = { id: string; name: string };

type FormState = {
  code: string;
  title: string;
  content_html: string;

  discount_type: DiscountType;
  discount_value: number;

  min_purchase: number;
  max_discount: number | null;
  usage_limit: number | null;

  valid_from: string; // YYYY-MM-DD (UI)
  valid_until: string | null; // YYYY-MM-DD | null (UI)

  is_active: boolean;

  applicable_to: Scope;
  category_ids: string[];
  product_ids: string[];
};

const todayStr = (): string => {
  const d = new Date();
  // local date -> YYYY-MM-DD
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * BE ISO/string -> UI date string (YYYY-MM-DD) veya null
 * undefined asla döndürmez (exactOptionalPropertyTypes friendly)
 */
const toUiDate = (iso?: string | null): string | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const numOr = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'number' ? v : Number(String(v ?? ''));
  return Number.isFinite(n) ? n : fallback;
};

const defaults: FormState = {
  code: '',
  title: '',
  content_html: '',

  discount_type: 'percentage',
  discount_value: 0,

  min_purchase: 0,
  max_discount: null,
  usage_limit: null,

  valid_from: todayStr(),
  valid_until: null,

  is_active: true,

  applicable_to: 'all',
  category_ids: [],
  product_ids: [],
};

export default function CouponForm() {
  const { id } = useParams<{ id?: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const {
    data,
    isFetching,
    isLoading: isQueryLoading,
    isSuccess,
  } = useGetCouponAdminByIdQuery(id as string, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [createCoupon, { isLoading: isCreating }] = useCreateCouponAdminMutation();
  const [updateCoupon, { isLoading: isUpdating }] = useUpdateCouponAdminMutation();

  // Kategori & ürün listeleri
  const { data: categoriesData = [], isLoading: categoriesLoading } =
    useListCategoriesAdminQuery(undefined);

  const { data: productsData = [], isLoading: productsLoading } = useListProductsAdminQuery({
    limit: 1000,
  });

  const categories: Category[] = useMemo(
    () => (categoriesData || []).map((c) => ({ id: c.id, name: c.name })),
    [categoriesData],
  );

  const products: Product[] = useMemo(
    () => (productsData || []).map((p) => ({ id: p.id, name: p.name })),
    [productsData],
  );

  const [formData, setFormData] = useState<FormState>(defaults);

  const saving = isCreating || isUpdating;
  const loadingLists = categoriesLoading || productsLoading;

  // Edit mode → formu doldur
  useEffect(() => {
    if (!isEdit) {
      setFormData(defaults);
      return;
    }
    if (isFetching || isQueryLoading) return;

    if (isSuccess && data) {
      const vf = toUiDate(data.valid_from) ?? todayStr();
      const vu = toUiDate(data.valid_until);

      setFormData({
        code: (data.code ?? '').toString(),
        title: (data.title ?? '').toString(),
        content_html: (data.content_html ?? '').toString(),

        discount_type: (data.discount_type ?? 'percentage') as DiscountType,
        discount_value: numOr(data.discount_value, 0),

        min_purchase: numOr(data.min_purchase, 0),
        max_discount: data.max_discount == null ? null : numOr(data.max_discount, 0),

        // model: max_uses => FE: usage_limit
        usage_limit: data.max_uses == null ? null : numOr(data.max_uses, 0),

        // ✅ asla undefined verme
        valid_from: vf,
        valid_until: vu,

        is_active: !!data.is_active,

        applicable_to: ((data.applicable_to as Scope) ?? 'all') as Scope,
        category_ids: Array.isArray(data.category_ids) ? data.category_ids : [],
        product_ids: Array.isArray(data.product_ids) ? data.product_ids : [],
      });
    }
  }, [isEdit, isFetching, isQueryLoading, isSuccess, data]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- Basit validasyonlar ---
    if (!formData.code.trim()) {
      toast.error('Kupon kodu zorunludur.');
      return;
    }
    if (!formData.discount_value || formData.discount_value <= 0) {
      toast.error('İndirim değeri sıfırdan büyük olmalıdır.');
      return;
    }
    if (!formData.valid_from.trim()) {
      toast.error('Başlangıç tarihi zorunludur.');
      return;
    }

    // Scope validation
    if (formData.applicable_to === 'product' && formData.product_ids.length === 0) {
      toast.error('Bu kupon belirli ürünler için; en az bir ürün seçmelisiniz.');
      return;
    }
    if (formData.applicable_to === 'category' && formData.category_ids.length === 0) {
      toast.error('Bu kupon belirli kategoriler için; en az bir kategori seçmelisiniz.');
      return;
    }

    // valid_until sanity: eğer doluysa valid_from'dan önce olmasın
    if (formData.valid_until && formData.valid_until < formData.valid_from) {
      toast.error('Bitiş tarihi başlangıç tarihinden önce olamaz.');
      return;
    }

    // RTK type: CreateCouponBody
    const payload: CreateCouponBody = {
      code: formData.code.trim(),
      title: formData.title.trim() ? formData.title.trim() : null,
      content_html: formData.content_html.trim() ? formData.content_html.trim() : null,

      discount_type: formData.discount_type,
      discount_value: Number(formData.discount_value) || 0,

      min_purchase: Number(formData.min_purchase) || 0,
      max_discount: formData.max_discount != null ? Number(formData.max_discount) : null,
      usage_limit: formData.usage_limit != null ? Number(formData.usage_limit) : null,

      // ✅ UI date (YYYY-MM-DD) gönderiyoruz. Mapper (toCouponApiBody) bunu null/str olarak taşır.
      valid_from: formData.valid_from,
      valid_until: formData.valid_until,

      is_active: formData.is_active,

      applicable_to: formData.applicable_to,
      category_ids:
        formData.applicable_to === 'category' && formData.category_ids.length
          ? formData.category_ids
          : null,
      product_ids:
        formData.applicable_to === 'product' && formData.product_ids.length
          ? formData.product_ids
          : null,
    };

    try {
      if (isEdit && id) {
        await updateCoupon({ id, body: payload }).unwrap();
        toast.success('Kupon güncellendi');
      } else {
        await createCoupon(payload).unwrap();
        toast.success('Kupon oluşturuldu');
      }
      navigate('/admin/coupons');
    } catch (err) {
      console.error(err);
      toast.error('Kupon kaydedilemedi');
    }
  };

  return (
    <AdminLayout title={isEdit ? 'Kupon Düzenle' : 'Yeni Kupon Ekle'}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/admin/coupons')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kupon Bilgileri</CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Kod + başlık */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="code">Kupon Kodu *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, code: e.target.value.toUpperCase() }))
                    }
                    required
                    placeholder="SUMMER2025"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Başlık (müşteriye gösterilecek)</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((s) => ({ ...s, title: e.target.value }))}
                    placeholder="Örn: İlk sipariş indirimi"
                  />
                </div>
              </div>

              {/* İçerik / açıklama */}
              <div className="space-y-2">
                <Label htmlFor="content_html">İçerik / Açıklama</Label>
                <Textarea
                  id="content_html"
                  rows={3}
                  value={formData.content_html}
                  onChange={(e) => setFormData((s) => ({ ...s, content_html: e.target.value }))}
                  placeholder="Sipariş özetinde veya sepet alanında gösterilecek kısa açıklama."
                />
              </div>

              {/* İndirim bilgileri */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discount_type">İndirim Türü</Label>
                  <Select
                    value={formData.discount_type}
                    onValueChange={(value: DiscountType) =>
                      setFormData((s) => ({ ...s, discount_type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Yüzde (%)</SelectItem>
                      <SelectItem value="fixed">Sabit Tutar (₺)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount_value">
                    İndirim Değeri * {formData.discount_type === 'percentage' ? '(%)' : '(₺)'}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        discount_value: Number(e.target.value || '0'),
                      }))
                    }
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              {/* Limitler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_purchase">Minimum Alışveriş (₺)</Label>
                  <Input
                    id="min_purchase"
                    type="number"
                    value={formData.min_purchase}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        min_purchase: Number(e.target.value || '0'),
                      }))
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usage_limit">Maksimum Kullanım (boş = sınırsız)</Label>
                  <Input
                    id="usage_limit"
                    type="number"
                    value={formData.usage_limit ?? ''}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        usage_limit: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    min="1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_discount">Maksimum İndirim (boş = sınırsız)</Label>
                  <Input
                    id="max_discount"
                    type="number"
                    value={formData.max_discount ?? ''}
                    onChange={(e) =>
                      setFormData((s) => ({
                        ...s,
                        max_discount: e.target.value ? Number(e.target.value) : null,
                      }))
                    }
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_from">Başlangıç Tarihi *</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, valid_from: e.target.value || todayStr() }))
                    }
                    required
                  />
                </div>
              </div>

              {/* Tarihler */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_until">Bitiş Tarihi (boş = süresiz)</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until ?? ''}
                    onChange={(e) =>
                      setFormData((s) => ({ ...s, valid_until: e.target.value || null }))
                    }
                    min={formData.valid_from}
                  />
                </div>
              </div>

              {/* Uygulama kapsamı */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Uygulama Kapsamı</Label>
                  <Select
                    value={formData.applicable_to}
                    onValueChange={(value: Scope) =>
                      setFormData((s) => ({
                        ...s,
                        applicable_to: value,
                        category_ids: value === 'category' ? s.category_ids : [],
                        product_ids: value === 'product' ? s.product_ids : [],
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tüm Site</SelectItem>
                      <SelectItem value="category">Belirli Kategoriler</SelectItem>
                      <SelectItem value="product">Belirli Ürünler</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.applicable_to === 'category' && (
                  <div className="space-y-2">
                    <Label>Kategoriler</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {loadingLists && categories.length === 0 && (
                        <div className="text-sm text-muted-foreground">
                          Kategoriler yükleniyor...
                        </div>
                      )}

                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`cat-${category.id}`}
                            checked={formData.category_ids.includes(category.id)}
                            onCheckedChange={(checked) =>
                              setFormData((s) => ({
                                ...s,
                                category_ids: checked
                                  ? Array.from(new Set([...s.category_ids, category.id]))
                                  : s.category_ids.filter((x) => x !== category.id),
                              }))
                            }
                          />
                          <Label htmlFor={`cat-${category.id}`} className="cursor-pointer">
                            {category.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {formData.applicable_to === 'product' && (
                  <div className="space-y-2">
                    <Label>Ürünler</Label>
                    <div className="border rounded-md p-4 max-h-48 overflow-y-auto">
                      {loadingLists && products.length === 0 && (
                        <div className="text-sm text-muted-foreground">Ürünler yükleniyor...</div>
                      )}

                      {products.map((product) => (
                        <div key={product.id} className="flex items-center space-x-2 mb-2">
                          <Checkbox
                            id={`prod-${product.id}`}
                            checked={formData.product_ids.includes(product.id)}
                            onCheckedChange={(checked) =>
                              setFormData((s) => ({
                                ...s,
                                product_ids: checked
                                  ? Array.from(new Set([...s.product_ids, product.id]))
                                  : s.product_ids.filter((x) => x !== product.id),
                              }))
                            }
                          />
                          <Label htmlFor={`prod-${product.id}`} className="cursor-pointer">
                            {product.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Aktif */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData((s) => ({ ...s, is_active: checked }))}
                />
                <Label htmlFor="is_active">Aktif</Label>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => navigate('/admin/coupons')}>
                  İptal
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Ekle'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
