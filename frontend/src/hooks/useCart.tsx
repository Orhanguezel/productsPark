// src/hooks/useCart.ts
import { useEffect, useState, useCallback } from "react";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import {
  useListCartItemsQuery,
  type CartItem,
} from "@/integrations/metahub/rtk/endpoints/cart_items.endpoints";

type GuestCartItem = { quantity?: number };

// Realtime tipi (opsiyonel — mevcutsa kullanılır)
type PostgresEvent = "*" | "INSERT" | "UPDATE" | "DELETE";
type PostgresFilter = {
  event: PostgresEvent;
  schema: string;
  table: string;
  filter?: string;
};

interface RealtimeChannel {
  on: (
    event: "postgres_changes",
    filter: PostgresFilter,
    cb: () => void
  ) => RealtimeChannel;
  subscribe: () => unknown;
}
interface RealtimeClient {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (ch: unknown) => void;
}

const isRealtimeClient = (x: unknown): x is RealtimeClient =>
  typeof (x as { channel?: unknown }).channel === "function" &&
  typeof (x as { removeChannel?: unknown }).removeChannel === "function";

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

  // 🔹 RTK: Kullanıcıya ait cart_items (products ile birlikte)
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
      skip: !user?.id, // misafir kullanıcıda request atma
    }
  );

  const fetchGuestCartCount = useCallback(() => {
    try {
      const raw = localStorage.getItem("guestCart");
      if (!raw) {
        setCartCount(0);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      const guestCart = isGuestCartArray(parsed) ? parsed : [];
      const total = guestCart.reduce<number>(
        (sum, it) => sum + (Number(it.quantity ?? 1) || 1),
        0
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
      fetchGuestCartCount();
      return;
    }
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

  // 🔹 Realtime + guestCartUpdated event
  useEffect(() => {
    if (user?.id) {
      // İlk mount'ta RTK zaten request atıyor, biz sadece realtime kuruyoruz
      let ch: RealtimeChannel | null = null;

      if (isRealtimeClient(metahub)) {
        ch = metahub
          .channel("cart-changes")
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "cart_items",
              filter: `user_id=eq.${user.id}`,
            },
            () => {
              // DB tarafında değişiklik olunca RTK query'i tazele
              fetchCartCount();
            }
          );
        ch.subscribe();
      }

      return () => {
        if (ch && isRealtimeClient(metahub)) {
          try {
            metahub.removeChannel(ch);
          } catch (e) {
            console.warn("removeChannel failed:", e);
          }
        }
      };
    } else {
      // Misafir sepeti: custom event ile güncelle
      fetchGuestCartCount();

      const onGuestCartUpdate = () => fetchGuestCartCount();
      window.addEventListener("guestCartUpdated", onGuestCartUpdate);
      return () =>
        window.removeEventListener("guestCartUpdated", onGuestCartUpdate);
    }
  }, [user?.id, fetchCartCount, fetchGuestCartCount]);

  // 🔹 loading: auth ise RTK loading, misafir ise direkt false
  const loading = user?.id ? rtkLoading : false;

  return { cartCount, loading, refetch: fetchCartCount };
};
