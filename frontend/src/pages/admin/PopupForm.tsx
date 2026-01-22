// =============================================================
// FILE: src/pages/admin/popups/PopupForm.tsx
// FINAL — Popup Form (Admin)
// - exactOptionalPropertyTypes friendly:
//   * CouponListParams: q undefined yazma, q yoksa property'yi OMIT et
//   * PopupAdminUpsertBody: payload'ı typed kur (title/content zorunlu)
// =============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

import { ArrowLeft, Upload, X, Save, Trash2, ChevronsUpDown, Check } from 'lucide-react';
import { Calendar as CalendarIcon } from 'lucide-react';

import {
  useGetPopupAdminByIdQuery,
  useCreatePopupAdminMutation,
  useUpdatePopupAdminMutation,
  useDeletePopupAdminMutation,
  useCreateAssetAdminMutation,
  useListProductsAdminQuery,
  useListCouponsAdminQuery,
  useGetCouponByCodeQuery,
} from '@/integrations/hooks';

import type { Coupon, CouponListParams, PopupAdminUpsertBody } from '@/integrations/types';

type Frequency = 'always' | 'once' | 'daily' | 'weekly';
type DisplayPages = 'all' | 'home' | 'products' | 'categories';

type FormState = {
  title: string;
  content: string;

  image_url: string;
  image_asset_id: string;
  image_alt: string;

  product_id: string;
  coupon_code: string;

  button_text: string;
  button_link: string;

  is_active: boolean;
  start_date: Date | null;
  end_date: Date | null;

  display_frequency: Frequency;
  display_pages: DisplayPages;

  priority: number;
  delay_seconds: number;
  duration_seconds: number;
};

const defaults: FormState = {
  title: '',
  content: '',

  image_url: '',
  image_asset_id: '',
  image_alt: '',

  product_id: '',
  coupon_code: '',

  button_text: '',
  button_link: '',

  is_active: true,
  start_date: null,
  end_date: null,

  display_frequency: 'always',
  display_pages: 'all',

  priority: 0,
  delay_seconds: 2,
  duration_seconds: 0,
};

function slugify(v: string) {
  return (
    (v || '')
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'popup'
  );
}

function errMsg(e: unknown): string {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object') {
    const d = (e as { data?: { error?: { message?: string } } }).data;
    if (d?.error?.message) return d.error.message;
  }
  return 'Beklenmeyen bir hata oluştu.';
}

function pickUrlAndId(res: unknown): { url: string | null; id: string | null } {
  const r =
    res && typeof res === 'object'
      ? (res as Record<string, unknown>)
      : ({} as Record<string, unknown>);

  const url =
    (typeof r.url === 'string' ? r.url : null) ||
    (typeof r.public_url === 'string' ? r.public_url : null) ||
    (typeof (r.data as any)?.url === 'string' ? ((r.data as any).url as string) : null) ||
    (typeof (r.asset as any)?.url === 'string' ? ((r.asset as any).url as string) : null) ||
    (typeof (r.file as any)?.url === 'string' ? ((r.file as any).url as string) : null) ||
    null;

  const id =
    (typeof r.asset_id === 'string' ? r.asset_id : null) ||
    (typeof r.id === 'string' ? r.id : null) ||
    (typeof (r.data as any)?.id === 'string' ? ((r.data as any).id as string) : null) ||
    (typeof (r.asset as any)?.id === 'string' ? ((r.asset as any).id as string) : null) ||
    (typeof (r.file as any)?.id === 'string' ? ((r.file as any).id as string) : null) ||
    null;

  return { url, id };
}

/** exactOptionalPropertyTypes: q undefined yazma -> property'yi tamamen çıkar */
function buildCouponListParams(qRaw: string, limit = 200, offset = 0): CouponListParams {
  const q = qRaw.trim();
  const out: CouponListParams = { limit, offset };
  if (q) out.q = q; // q boşsa hiç set etmiyoruz
  return out;
}

export default function PopupForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;

  const { data, isFetching, isLoading, isSuccess } = useGetPopupAdminByIdQuery(id as string, {
    skip: !isEdit,
    refetchOnMountOrArgChange: true,
  });

  const [createPopup, { isLoading: isCreating }] = useCreatePopupAdminMutation();
  const [updatePopup, { isLoading: isUpdating }] = useUpdatePopupAdminMutation();
  const [deletePopup, { isLoading: isDeleting }] = useDeletePopupAdminMutation();
  const [uploadAsset, { isLoading: isUploading }] = useCreateAssetAdminMutation();

  const [formData, setFormData] = useState<FormState>(defaults);
  const saving = isCreating || isUpdating;

  const imageInputRef = useRef<HTMLInputElement | null>(null);

  // --- Ürün arama (combobox) ---
  const [productOpen, setProductOpen] = useState(false);
  const [productQuery, setProductQuery] = useState('');

  const { data: productRows = [], isFetching: loadingProducts } = useListProductsAdminQuery(
    { q: productQuery, limit: 50, offset: 0 },
    { refetchOnMountOrArgChange: true },
  );

  const productMap = useMemo(
    () => Object.fromEntries(productRows.map((p) => [p.id, p.name])),
    [productRows],
  );

  const selectedProductName = formData.product_id
    ? productMap[formData.product_id] || `#${formData.product_id}`
    : '';

  // --- Kupon arama (combobox) ---
  const [couponOpen, setCouponOpen] = useState(false);
  const [couponQuery, setCouponQuery] = useState('');

  const couponListParams = useMemo(() => buildCouponListParams(couponQuery, 200, 0), [couponQuery]);

  const { data: couponRows = [], isFetching: loadingCoupons } = useListCouponsAdminQuery(
    couponListParams, // ✅ q undefined yok, exactOptionalPropertyTypes uyumlu
    { refetchOnMountOrArgChange: true },
  );

  // Seçili kuponu kodla getir
  const { data: selectedCoupon } = useGetCouponByCodeQuery(formData.coupon_code, {
    skip: !formData.coupon_code,
  });

  const couponsFinal: Coupon[] = useMemo(() => {
    const base = (couponRows ?? []) as Coupon[];
    if (selectedCoupon && !base.some((c) => c.code === selectedCoupon.code)) {
      return [selectedCoupon, ...base];
    }
    return base;
  }, [couponRows, selectedCoupon]);

  useEffect(() => {
    if (!isEdit) {
      setFormData(defaults);
      return;
    }
    if (isFetching || isLoading) return;

    if (isSuccess && data) {
      const d = data as Record<string, unknown>;

      const start = typeof d.start_date === 'string' ? new Date(d.start_date) : null;
      const end = typeof d.end_date === 'string' ? new Date(d.end_date) : null;

      setFormData({
        title: (d.title as string) || '',
        content: (d.content as string) || '',

        image_url: (d.image_url as string) || '',
        image_asset_id: (d.image_asset_id as string) || '',
        image_alt: (d.image_alt as string) || '',

        product_id: (d.product_id as string) || '',
        coupon_code: (d.coupon_code as string) || '',

        button_text: (d.button_text as string) || '',
        button_link: (d.button_link as string) || '',

        is_active: !!d.is_active,
        start_date: start && Number.isFinite(start.valueOf()) ? start : null,
        end_date: end && Number.isFinite(end.valueOf()) ? end : null,

        display_frequency: (d.display_frequency as Frequency) || 'always',
        display_pages: (d.display_pages as DisplayPages) || 'all',

        priority: typeof d.priority === 'number' ? d.priority : Number(d.priority ?? 0),
        delay_seconds:
          typeof d.delay_seconds === 'number' ? d.delay_seconds : Number(d.delay_seconds ?? 0),
        duration_seconds:
          typeof d.duration_seconds === 'number'
            ? d.duration_seconds
            : Number(d.duration_seconds ?? 0),
      });
    }
  }, [isEdit, isFetching, isLoading, isSuccess, data]);

  const canSave = useMemo(
    () => !!formData.title.trim() && !!formData.content.trim(),
    [formData.title, formData.content],
  );

  const handleSave = async () => {
    if (!canSave) {
      toast({
        title: 'Uyarı',
        description: 'Zorunlu alanları doldurun.',
        variant: 'destructive',
      });
      return;
    }

    // ✅ PopupAdminUpsertBody: title/content zorunlu -> typed payload
    const payload: PopupAdminUpsertBody = {
      title: formData.title.trim(),
      content: formData.content,

      image_url: formData.image_url ? formData.image_url : null,
      image_asset_id: formData.image_asset_id ? formData.image_asset_id : null,
      image_alt: formData.image_alt ? formData.image_alt : null,

      button_text: formData.button_text ? formData.button_text : null,
      button_link: formData.button_link ? formData.button_link : null,

      is_active: formData.is_active,

      display_frequency: formData.display_frequency,

      delay_seconds: formData.delay_seconds,
      duration_seconds: formData.duration_seconds,
      priority: formData.priority,

      // BE expectation: ISO string or null
      start_date: formData.start_date ? formData.start_date.toISOString() : null,
      end_date: formData.end_date ? formData.end_date.toISOString() : null,

      product_id: formData.product_id ? formData.product_id : null,
      coupon_code: formData.coupon_code ? formData.coupon_code : null,
    };

    try {
      if (isEdit && id) {
        await updatePopup({ id, body: payload }).unwrap();
        toast({ title: 'Başarılı', description: 'Popup güncellendi.' });
      } else {
        await createPopup(payload).unwrap();
        toast({ title: 'Başarılı', description: 'Popup oluşturuldu.' });
      }
      navigate('/admin/popups');
    } catch (e: unknown) {
      console.error(e);
      toast({ title: 'Hata', description: errMsg(e), variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!window.confirm('Bu popup silinecek. Emin misiniz?')) return;

    try {
      await deletePopup(id).unwrap();
      toast({ title: 'Silindi', description: 'Popup silindi.' });
      navigate('/admin/popups');
    } catch (e: unknown) {
      console.error(e);
      toast({ title: 'Hata', description: errMsg(e), variant: 'destructive' });
    }
  };

  // Görsel yükleme
  const [uploading, setUploading] = useState(false);

  const onPickImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Geçersiz', description: 'Lütfen görsel seçin.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Büyük Dosya', description: 'Maksimum 5MB.', variant: 'destructive' });
      return;
    }

    setUploading(true);
    try {
      const safe = slugify(formData.title || 'popup');
      const folder = `popups/${safe}/cover`;

      const assetRes = await uploadAsset({
        file,
        bucket: 'popups',
        folder,
        metadata: { module: 'popups', type: 'cover' },
      }).unwrap();

      const { url, id: assetId } = pickUrlAndId(assetRes);
      if (!url) throw new Error('upload_failed_no_url');

      setFormData((s) => ({
        ...s,
        image_url: url || s.image_url,
        image_asset_id: assetId || s.image_asset_id,
      }));

      toast({ title: 'Yüklendi', description: 'Görsel başarıyla yüklendi.' });
    } catch (e: unknown) {
      console.error(e);
      toast({ title: 'Hata', description: errMsg(e), variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setFormData((s) => ({
      ...s,
      image_url: '',
      image_asset_id: '',
      image_alt: '',
    }));
  };

  const couponLabel = (c: Coupon) => {
    const type = String(c.discount_type || '').toLowerCase();
    const val = Number(c.discount_value || 0);
    const main = type === 'percentage' ? `%${val}` : `${val}₺`;
    return c.title ? `${c.code} — ${c.title} (${main})` : `${c.code} (${main})`;
  };

  return (
    <AdminLayout title={isEdit ? 'Popup Düzenle' : 'Yeni Popup'}>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin/popups')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <h1 className="text-3xl font-bold">{isEdit ? 'Popup Düzenle' : 'Yeni Popup'}</h1>

          {isEdit && (
            <Button
              variant="destructive"
              className="ml-auto"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {isDeleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sol */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Popup İçeriği</h2>

              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              {/* Ürün seçimi */}
              <div className="space-y-2">
                <Label>Ürün (Opsiyonel)</Label>
                <Popover open={productOpen} onOpenChange={setProductOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {formData.product_id ? selectedProductName : 'Ürün seçin'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[420px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Ürün ara..."
                        value={productQuery}
                        onValueChange={setProductQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {loadingProducts ? 'Yükleniyor...' : 'Sonuç yok'}
                        </CommandEmpty>
                        <CommandGroup heading="Ürünler">
                          <CommandItem
                            key="none"
                            onSelect={() => {
                              setFormData((s) => ({ ...s, product_id: '' }));
                              setProductOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                !formData.product_id ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            Ürün Seçilmedi
                          </CommandItem>

                          {productRows.map((p) => (
                            <CommandItem
                              key={p.id}
                              onSelect={() => {
                                setFormData((s) => ({ ...s, product_id: p.id }));
                                setProductOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  formData.product_id === p.id ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {p.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <p className="text-xs text-muted-foreground">
                  Seçilirse buton linkini ürün sayfasına yönlendirebilirsin.
                </p>
              </div>

              {/* Kupon seçimi */}
              <div className="space-y-2">
                <Label>Kupon</Label>
                <Popover open={couponOpen} onOpenChange={setCouponOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between">
                      {formData.coupon_code
                        ? couponsFinal.find((c) => c.code === formData.coupon_code)?.code ||
                          formData.coupon_code
                        : 'Kupon seçin veya arayın'}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>

                  <PopoverContent className="w-[420px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Kodla veya adla ara..."
                        value={couponQuery}
                        onValueChange={setCouponQuery}
                      />
                      <CommandList>
                        <CommandEmpty>
                          {loadingCoupons ? 'Yükleniyor...' : 'Sonuç yok'}
                        </CommandEmpty>
                        <CommandGroup heading="Kuponlar">
                          <CommandItem
                            key="none"
                            onSelect={() => {
                              setFormData((s) => ({ ...s, coupon_code: '' }));
                              setCouponOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                !formData.coupon_code ? 'opacity-100' : 'opacity-0',
                              )}
                            />
                            Kupon Seçilmedi
                          </CommandItem>

                          {couponsFinal.map((c) => (
                            <CommandItem
                              key={c.id}
                              onSelect={() => {
                                setFormData((s) => ({ ...s, coupon_code: c.code }));
                                setCouponOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  'mr-2 h-4 w-4',
                                  formData.coupon_code === c.code ? 'opacity-100' : 'opacity-0',
                                )}
                              />
                              {couponLabel(c)}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                <p className="text-xs text-muted-foreground">
                  Kupon seçilirse popup içinde kupon etiketi gösterilir.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="button_text">Buton Metni</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) => setFormData({ ...formData, button_text: e.target.value })}
                    placeholder="Hemen Al"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="button_link">Buton Linki</Label>
                  <Input
                    id="button_link"
                    value={formData.button_link}
                    onChange={(e) => setFormData({ ...formData, button_link: e.target.value })}
                    placeholder="/urunler"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Popup Görseli</Label>

                {!formData.image_url ? (
                  <>
                    <input
                      ref={imageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onPickImage}
                      className="hidden"
                    />

                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploading || isUploading}
                      className="w-full"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading || isUploading ? 'Yükleniyor...' : 'Görsel Yükle'}
                    </Button>

                    <p className="text-xs text-muted-foreground">PNG/JPG/WEBP, max 5MB</p>
                  </>
                ) : (
                  <div className="space-y-3">
                    <div className="relative border rounded-lg overflow-hidden">
                      <img
                        src={formData.image_url}
                        alt={formData.image_alt || 'Önizleme'}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src =
                            'https://placehold.co/600x400?text=Image';
                        }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2"
                        onClick={clearImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="image_alt">Alt Metin (SEO)</Label>
                        <Input
                          id="image_alt"
                          value={formData.image_alt}
                          onChange={(e) => setFormData({ ...formData, image_alt: e.target.value })}
                          placeholder='Örn: "Popup kampanya görseli"'
                        />
                        {formData.image_asset_id && (
                          <p className="text-xs text-muted-foreground">
                            Asset ID: {formData.image_asset_id}
                          </p>
                        )}
                      </div>

                      <div className="self-end">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={uploading || isUploading}
                          className="w-full"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Farklı Görsel Yükle
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sağ */}
          <div className="space-y-6">
            <div className="bg-card border rounded-lg p-6 space-y-6">
              <h2 className="text-lg font-semibold">Görünüm Ayarları</h2>

              <div className="space-y-2">
                <Label>Başlangıç Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left',
                        !formData.start_date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.start_date
                        ? format(formData.start_date, 'dd.MM.yyyy')
                        : 'Tarih seçin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.start_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, start_date: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Bitiş Tarihi</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left',
                        !formData.end_date && 'text-muted-foreground',
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.end_date ? format(formData.end_date, 'dd.MM.yyyy') : 'Tarih seçin'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.end_date || undefined}
                      onSelect={(date) => setFormData({ ...formData, end_date: date || null })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_frequency">Görünüm Sıklığı</Label>
                <Select
                  value={formData.display_frequency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, display_frequency: value as Frequency })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="always">Her Zaman</SelectItem>
                    <SelectItem value="once">Bir Kez (Cookie)</SelectItem>
                    <SelectItem value="daily">Günde Bir</SelectItem>
                    <SelectItem value="weekly">Haftada Bir</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_pages">Gösterilecek Sayfalar</Label>
                <Select
                  value={formData.display_pages}
                  onValueChange={(value) =>
                    setFormData({ ...formData, display_pages: value as DisplayPages })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Sayfalar</SelectItem>
                    <SelectItem value="home">Anasayfa</SelectItem>
                    <SelectItem value="products">Ürünler</SelectItem>
                    <SelectItem value="categories">Kategoriler</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Öncelik (0-100)</Label>
                <Input
                  id="priority"
                  type="number"
                  min={0}
                  max={100}
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">Yüksek öncelik önce gösterilir</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="delay_seconds">Gecikme (sn)</Label>
                <Input
                  id="delay_seconds"
                  type="number"
                  min={0}
                  max={60}
                  value={formData.delay_seconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      delay_seconds: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_seconds">Oto Kapanma (sn)</Label>
                <Input
                  id="duration_seconds"
                  type="number"
                  min={0}
                  max={300}
                  value={formData.duration_seconds}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      duration_seconds: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">0 = yok</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="text-base">
                    Durum
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {formData.is_active ? 'Popup aktif' : 'Popup pasif'}
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
            </div>

            {(formData.title || formData.content) && (
              <div className="bg-card border rounded-lg p-6 space-y-4">
                <h2 className="text-lg font-semibold">Önizleme</h2>
                <div className="border rounded-lg overflow-hidden bg-background">
                  {formData.image_url && (
                    <img
                      src={formData.image_url}
                      alt={formData.image_alt || 'Önizleme'}
                      className="w-full h-32 object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  )}
                  <div className="p-4 space-y-2">
                    {formData.title && <h3 className="font-bold text-sm">{formData.title}</h3>}
                    {formData.content && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {formData.content}
                      </p>
                    )}
                    {formData.coupon_code && (
                      <div className="bg-primary/10 border border-primary/20 rounded p-2 text-center">
                        <p className="text-xs font-mono font-bold text-primary">
                          {formData.coupon_code}
                        </p>
                      </div>
                    )}
                    {formData.button_text && (
                      <Button size="sm" className="w-full text-xs">
                        {formData.button_text}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4 pt-4 border-t">
          <Button onClick={handleSave} disabled={saving || !canSave}>
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>

          <Button type="button" variant="outline" onClick={() => navigate('/admin/popups')}>
            İptal
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
