// =============================================================
// FILE: src/hooks/useCart.ts
// =============================================================

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  useListCartItemsQuery,
  type CartItem,
} from "@/integrations/metahub/rtk/endpoints/cart_items.endpoints";

type GuestCartItem = { quantity?: number };

const isGuestCartArray = (x: unknown): x is GuestCartItem[] =>
  Array.isArray(x) &&
  x.every((i) => {
    if (typeof i !== "object" || i === null) return false;
    const q = (i as { quantity?: unknown }).quantity;
    return typeof q === "undefined" || typeof q === "number";
  });

export const useCart = () => {
  const { user } = useAuth();

  const [cartCount, setCartCount] = useState(0);

  // 🔹 RTK: Kullanıcıya ait cart_items (products join ile)
  const {
    data: userCartItems = [],
    isLoading: rtkLoading,
    refetch: rtkRefetch,
  } = useListCartItemsQuery(
    {
      user_id: user?.id,
      with: "products",
    },
    {
      // misafir kullanıcıda request atma
      skip: !user?.id,
    },
  );

  const fetchGuestCartCount = useCallback(() => {
    try {
      if (typeof window === "undefined") {
        setCartCount(0);
        return;
      }

      const raw = window.localStorage.getItem("guestCart");
      if (!raw) {
        setCartCount(0);
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      const guestCart = isGuestCartArray(parsed) ? parsed : [];
      const total = guestCart.reduce<number>(
        (sum, it) => sum + (Number(it.quantity ?? 1) || 1),
        0,
      );
      setCartCount(total);
    } catch (err) {
      console.error("Error loading guest cart count:", err);
      setCartCount(0);
    }
  }, []);

  // 🔹 Dışarıya expose edeceğimiz refetch
  const fetchCartCount = useCallback(async () => {
    if (!user?.id) {
      // misafir
      fetchGuestCartCount();
      return;
    }
    // auth user: RTK query'i refetch et
    await rtkRefetch();
  }, [user?.id, fetchGuestCartCount, rtkRefetch]);

  // 🔹 data değiştiğinde cartCount hesapla (auth vs guest)
  useEffect(() => {
    if (!user?.id) {
      // misafir: sadece localStorage
      fetchGuestCartCount();
      return;
    }

    // auth user: RTK’den gelen userCartItems üzerinden say
    const rows: CartItem[] = Array.isArray(userCartItems) ? userCartItems : [];
    const total = rows.reduce<number>((sum, item) => {
      const opts = item.products?.quantity_options;
      const hasQuantityOptions = Array.isArray(opts) && opts.length > 0;
      const q = Number(item.quantity ?? 0);

      // quantity_options varsa her satırı 1 ürün gibi sayıyoruz
      return sum + (hasQuantityOptions ? 1 : q);
    }, 0);

    setCartCount(total);
  }, [user?.id, userCartItems, fetchGuestCartCount]);

  // 🔹 guestCartUpdated event ile misafir sepetini reaktif yap
  useEffect(() => {
    if (!user?.id && typeof window !== "undefined") {
      fetchGuestCartCount();

      const onGuestCartUpdate = () => fetchGuestCartCount();
      window.addEventListener("guestCartUpdated", onGuestCartUpdate);

      return () => {
        window.removeEventListener("guestCartUpdated", onGuestCartUpdate);
      };
    }

    // user varsa ekstra event’e gerek yok; RTK invalidation ile güncelleniyor
    return;
  }, [user?.id, fetchGuestCartCount]);

  // 🔹 loading: auth ise RTK loading, misafir ise direkt false
  const loading = user?.id ? rtkLoading : false;

  return { cartCount, loading, refetch: fetchCartCount };
};
