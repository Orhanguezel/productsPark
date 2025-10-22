import { useState, useEffect } from "react";
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
import { ShoppingCart, ArrowRight, X } from "lucide-react";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/hooks/useCart";

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    image_url: string | null;
    delivery_type?: string;
    quantity_options?: { quantity: number, price: number }[] | null;
  };
}

export const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useCart();
  const [open, setOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleCartAdded = () => {
      setOpen(true);
      fetchCartItems();
    };

    window.addEventListener("cartItemAdded", handleCartAdded);
    return () => window.removeEventListener("cartItemAdded", handleCartAdded);
  }, [user]);

  const fetchCartItems = async () => {
    setLoading(true);
    try {
      if (!user) {
        // Load guest cart
        const guestCartData = localStorage.getItem('guestCart');
        if (!guestCartData) {
          setCartItems([]);
          return;
        }

        const guestCart = JSON.parse(guestCartData);
        const productIds = guestCart.map((item: any) => item.productId);

        const { data: products, error } = await metahub
          .from("products")
          .select("id, name, slug, price, image_url, delivery_type, quantity_options")
          .in("id", productIds);

        if (error) throw error;

        const items: CartItem[] = guestCart.map((guestItem: any) => {
          const product = products?.find(p => p.id === guestItem.productId);
          if (!product) return null;

          return {
            id: guestItem.productId,
            quantity: guestItem.quantity,
            products: product as any
          };
        }).filter(Boolean);

        setCartItems(items);
      } else {
        // Load user cart
        const { data, error } = await metahub
          .from("cart_items")
          .select(`
            id,
            quantity,
            products:product_id (
              id,
              name,
              slug,
              price,
              image_url,
              delivery_type,
              quantity_options
            )
          `)
          .eq("user_id", user.id)
          .limit(5);

        if (error) throw error;
        setCartItems((data || []) as unknown as CartItem[]);
      }
    } catch (error) {
      console.error("Error fetching cart items:", error);
    } finally {
      setLoading(false);
    }
  };

  const getItemPrice = (item: CartItem) => {
    if (item.products.quantity_options && Array.isArray(item.products.quantity_options)) {
      const matchingOption = item.products.quantity_options.find(
        opt => opt.quantity === item.quantity
      );
      if (matchingOption) {
        return matchingOption.price;
      }
    }
    return item.products.price * item.quantity;
  };

  const subtotal = cartItems.reduce((sum, item) => sum + getItemPrice(item), 0);

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
                <div key={item.id} className="flex gap-3 p-3 rounded-lg border">
                  <img
                    src={item.products.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=80&h=80&fit=crop"}
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
