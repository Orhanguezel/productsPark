Yeni bir UI bileşeni oluştur: $ARGUMENTS

## ProductsPark Frontend Yapısı

Frontend: React 18 + TypeScript + Vite + shadcn-ui + Tailwind CSS

### Bileşen Konumları

```
frontend/src/
├── components/
│   ├── ui/           ← shadcn-ui temel bileşenler (Button, Card, Input vb.)
│   ├── layout/       ← Layout wrapper'lar
│   ├── common/       ← Paylaşılan bileşenler (Header, Footer, Navigation)
│   ├── home/         ← Ana sayfa bileşenleri
│   └── admin/        ← Admin panel bileşenleri
├── pages/
│   ├── public/       ← Kullanıcı sayfaları
│   └── admin/        ← Admin sayfaları
└── hooks/            ← Custom React hooks
```

### shadcn-ui Bileşen Kullanımı

shadcn-ui bileşenlerini tercih et:

```typescript
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
```

### TypeScript Pattern

```typescript
// Props interface tanımı
interface ComponentNameProps {
  /** Benzersiz kimlik */
  id?: string;
  /** Başlık metni */
  title: string;
  /** Yükleniyor durumu */
  isLoading?: boolean;
  /** Değişiklik callback'i */
  onChange?: (value: string) => void;
  /** Alt bileşenler */
  children?: React.ReactNode;
  /** Ek CSS sınıfları */
  className?: string;
}

// Functional component
export function ComponentName({
  id,
  title,
  isLoading = false,
  onChange,
  children,
  className
}: ComponentNameProps) {
  // Hook'lar en üstte
  const [value, setValue] = useState('');

  // Handler fonksiyonlar
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
    onChange?.(e.target.value);
  };

  // Early return for loading
  if (isLoading) {
    return <div className="animate-pulse">Yükleniyor...</div>;
  }

  return (
    <div id={id} className={cn('space-y-4', className)}>
      <h2>{title}</h2>
      {children}
    </div>
  );
}
```

### RTK Query ile Data Fetching

```typescript
import { useListProductsQuery } from '@/integrations/hooks';

export function ProductList() {
  const { data: products, isLoading, error } = useListProductsQuery();

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!products?.length) return <EmptyState message="Ürün bulunamadı" />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Form Pattern (React Hook Form + Zod)

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

const formSchema = z.object({
  name: z.string().min(1, 'İsim zorunlu'),
  email: z.string().email('Geçerli e-posta girin'),
});

type FormValues = z.infer<typeof formSchema>;

export function ContactForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '' },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>İsim</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Gönder</Button>
      </form>
    </Form>
  );
}
```

### Tailwind CSS Kullanımı

```typescript
// cn() helper ile conditional class
import { cn } from '@/lib/utils';

<div className={cn(
  'p-4 rounded-lg border',
  isActive && 'border-primary bg-primary/10',
  disabled && 'opacity-50 cursor-not-allowed'
)}>
```

## Kontrol Listesi

- [ ] TypeScript props interface tanımlandı
- [ ] shadcn-ui bileşenleri kullanıldı
- [ ] Loading state handle edildi
- [ ] Error state handle edildi
- [ ] Empty state handle edildi
- [ ] Responsive tasarım uygulandı (md:, lg: breakpoint'ler)
- [ ] Dark mode uyumlu (Tailwind dark: prefix)
- [ ] Accessibility (ARIA label, keyboard nav)
