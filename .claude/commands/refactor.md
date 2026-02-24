Belirtilen kodu veya modülü refactor et: $ARGUMENTS

## Refactoring Prensipleri

### 1. Önce Anla, Sonra Değiştir

- Mevcut kodu oku ve anla
- Test coverage'ı kontrol et
- Bağımlılıkları haritala
- Refactoring planı oluştur

### 2. Küçük Adımlarla İlerle

- Bir seferde bir değişiklik
- Her adımda çalışır durumda tut
- Sık sık commit at
- Breaking change'lerden kaçın

## ProductsPark Refactoring Pattern'leri

### Backend Refactoring

#### Controller Büyüdüyse
```typescript
// ÖNCE: Tek büyük controller
// controller.ts (500+ satır)

// SONRA: Ayrılmış controller'lar
// controller.ts         ← Public endpoint'ler
// admin.controller.ts   ← Admin endpoint'ler
// [feature].controller.ts ← Özel özellik endpoint'leri
```

#### Tekrarlanan Query Pattern'i
```typescript
// ÖNCE: Her controller'da tekrar
const list = async () => {
  const rows = await db.select().from(table).where(...);
  return rows;
};

// SONRA: Repository pattern
// repository.ts
export const itemRepository = {
  findAll: () => db.select().from(items),
  findById: (id: string) => db.select().from(items).where(eq(items.id, id)).limit(1),
  create: (data: NewItem) => db.insert(items).values(data),
};

// controller.ts
const list = async () => itemRepository.findAll();
```

### Frontend Refactoring

#### Component Büyüdüyse
```typescript
// ÖNCE: Tek büyük component (300+ satır)
// ProductPage.tsx

// SONRA: Ayrılmış component'ler
// ProductPage.tsx           ← Ana sayfa (orchestration)
// components/ProductHeader.tsx
// components/ProductDetails.tsx
// components/ProductActions.tsx
// hooks/useProduct.ts       ← Custom hook
```

#### Tekrarlanan Form Pattern'i
```typescript
// ÖNCE: Her form'da tekrar
const form = useForm({ resolver: zodResolver(schema) });
const onSubmit = async (data) => {
  try {
    await mutation(data).unwrap();
    toast.success('Başarılı');
    navigate(-1);
  } catch {
    toast.error('Hata');
  }
};

// SONRA: Custom hook
// hooks/useFormSubmit.ts
export function useFormSubmit<T>(mutation, options) {
  const navigate = useNavigate();

  return async (data: T) => {
    try {
      await mutation(data).unwrap();
      toast.success(options.successMessage);
      if (options.redirectBack) navigate(-1);
    } catch {
      toast.error(options.errorMessage);
    }
  };
}
```

#### RTK Query Endpoint Gruplandırma
```typescript
// ÖNCE: Dağınık endpoint'ler
// products.endpoints.ts (public + admin karışık)

// SONRA: Ayrı dosyalar
// rtk/public/products.endpoints.ts
// rtk/admin/products.admin.endpoints.ts
```

## Refactoring Kontrol Listesi

### Başlamadan Önce
- [ ] Mevcut davranış anlaşıldı
- [ ] Test var mı? Yoksa önce yaz
- [ ] Bağımlılıklar belirlendi
- [ ] Git branch oluşturuldu

### Refactoring Sırasında
- [ ] Küçük adımlarla ilerle
- [ ] Her adımda build çalışıyor
- [ ] TypeScript hataları yok
- [ ] Var olan testler geçiyor

### Bitirdikten Sonra
- [ ] Kod daha okunabilir mi?
- [ ] Tekrar azaldı mı?
- [ ] Performans etkilenmedi mi?
- [ ] Breaking change var mı?

## Kaçınılması Gerekenler

❌ Refactoring + feature aynı commit'te
❌ Testler olmadan büyük refactoring
❌ Her şeyi bir seferde değiştirmek
❌ Public API'yi bozmak
❌ Premature optimization
