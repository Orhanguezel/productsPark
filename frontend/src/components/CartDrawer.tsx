// =============================================================
// FILE: src/components/.../CartDrawer.tsx
// =============================================================
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, ArrowRight } from "lucide-react";

import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

import {
  useListProductsQuery,
  useListCartItemsQuery
 } from "@/integrations/hooks";

type UICartItem = {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    delivery_type?: string | null;
    quantity_options?: { quantity: number; price: number }[] | null;
  };
};

type GuestCartRawItem = {
  productId: string;
  quantity: number;
  selected_options?: Record<string, unknown> | null;
};

const readGuestCart = (): GuestCartRawItem[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("guestCart");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GuestCartRawItem[];
  } catch {
    return [];
  }
};

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useCart();

  const [open, setOpen] = useState(false);
  const [guestCart, setGuestCart] = useState<GuestCartRawItem[]>(() =>
    readGuestCart()
  );

  // cartItemAdded event → çekme + drawer aç
  useEffect(() => {
    const handleCartAdded = () => {
      setOpen(true);

      // Global cart hook’u da tetikle (varsa)
      if (typeof refetch === "function") {
        void refetch();
      }

      // Guest ise localStorage'dan tekrar oku
      if (!user) {
        setGuestCart(readGuestCart());
      }
    };

    window.addEventListener("cartItemAdded", handleCartAdded);
    return () => window.removeEventListener("cartItemAdded", handleCartAdded);
  }, [user, refetch]);

  // ----------------- RTK: USER CART -----------------
  const {
    data: userCartItems,
    isLoading: userCartLoading,
  } = useListCartItemsQuery(
    {
      user_id: user?.id,
      with: "products",
      limit: 5,
      sort: "created_at",
      order: "desc",
    },
    {
      skip: !user,
    }
  );

  // ----------------- RTK: GUEST CART (Products by ids) -----------------
  const guestProductIds = useMemo(
    () => guestCart.map((g) => g.productId),
    [guestCart]
  );

  const shouldFetchGuestProducts = !user && guestProductIds.length > 0;

  const {
    data: guestProducts,
    isLoading: guestProductsLoading,
  } = useListProductsQuery(
    shouldFetchGuestProducts ? { ids: guestProductIds } : undefined,
    {
      skip: !shouldFetchGuestProducts,
    }
  );

  // ----------------- UI Cart Items (user vs guest) -----------------
  const cartItems: UICartItem[] = useMemo(() => {
    // Logged-in user → RTK cart_items
    if (user) {
      if (!userCartItems) return [];
      return userCartItems
        .filter((c) => c.products)
        .map((c) => {
          const p = c.products!;
          return {
            id: c.id,
            quantity: c.quantity,
            products: {
              id: p.id,
              name: p.name,
              slug: p.slug,
              price: p.price,
              image_url: p.image_url ?? null,
              delivery_type: p.delivery_type ?? null,
              quantity_options: p.quantity_options ?? null,
            },
          };
        });
    }

    // Guest → localStorage guestCart + RTK products
    if (!guestCart.length || !guestProducts?.length) return [];

    return guestCart
      .map<UICartItem | null>((g) => {
        const product = guestProducts.find((p) => p.id === g.productId);
        if (!product) return null;
        return {
          id: g.productId,
          quantity: g.quantity,
          products: {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: product.price,
            image_url: product.image_url ?? null,
            delivery_type: product.delivery_type ?? null,
            quantity_options: product.quantity_options ?? null,
          },
        };
      })
      .filter(Boolean) as UICartItem[];
  }, [user, userCartItems, guestCart, guestProducts]);

  // ----------------- Helpers -----------------
  const getItemPrice = (item: UICartItem) => {
    const opts = item.products.quantity_options;
    if (opts && Array.isArray(opts)) {
      const match = opts.find((o) => o.quantity === item.quantity);
      if (match) return match.price;
    }
    return item.products.price * item.quantity;
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + getItemPrice(item),
    0
  );

  const loading =
    (user && userCartLoading) ||
    (!user &&
      shouldFetchGuestProducts &&
      guestProductsLoading);

  const handleGoToCart = () => {
    setOpen(false);
    navigate("/sepet");
  };

  const handleContinueShopping = () => {
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Sepetiniz
          </SheetTitle>
        </SheetHeader>

        <Separator className="my-4" />

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <p className="text-muted-foreground">Yükleniyor...</p>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <ShoppingCart className="w-12 h-12 text-muted-foreground mb-2" />
              <p className="text-muted-foreground">Sepetiniz boş</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-lg border"
                >
                  <img
                    src={
                      item.products.image_url ||
                      "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop"
                    }
                    alt={item.products.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                      {item.products.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mb-1">
                      Miktar: {item.quantity}
                    </p>
                    <p className="text-sm font-bold text-primary">
                      {formatPrice(getItemPrice(item))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator className="my-4" />

        <SheetFooter className="flex-col space-y-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-lg font-semibold">Toplam:</span>
            <span className="text-2xl font-bold text-primary">
              {formatPrice(subtotal)}
            </span>
          </div>

          <div className="flex flex-col gap-2 w-full">
            <Button
              className="w-full gradient-primary text-white"
              size="lg"
              onClick={handleGoToCart}
            >
              Sepete Git
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              variant="outline"
              className="w-full"
              size="lg"
              onClick={handleContinueShopping}
            >
              Alışverişe Devam Et
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
