// =============================================================
// FILE: src/hooks/useCart.ts
// FINAL — Cart count hook (auth cart_items via RTK + guest localStorage)
// - Types from "@/integrations/types"
// - RTK hooks from "@/integrations/hooks"
// - Strict / no-any
// =============================================================

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';

import { useListCartItemsQuery } from '@/integrations/hooks';

import type { PublicCartItem } from '@/integrations/types';

type GuestCartItem = { quantity?: number };

const isGuestCartArray = (x: unknown): x is GuestCartItem[] =>
  Array.isArray(x) &&
  x.every((i) => {
    if (typeof i !== 'object' || i === null) return false;
    const q = (i as { quantity?: unknown }).quantity;
    return typeof q === 'undefined' || typeof q === 'number';
  });

export const useCart = () => {
  const { user } = useAuth();

  const [cartCount, setCartCount] = useState(0);

  // 🔹 RTK: Kullanıcıya ait cart_items (opsiyonel: products join)
  const {
    data: userCartItems = [],
    isLoading: rtkLoading,
    refetch: rtkRefetch,
  } = useListCartItemsQuery(
    user?.id
      ? {
          user_id: user.id,
          with: 'products',
        }
      : undefined,
    {
      // misafir kullanıcıda request atma
      skip: !user?.id,
    },
  );

  const fetchGuestCartCount = useCallback(() => {
    try {
      if (typeof window === 'undefined') {
        setCartCount(0);
        return;
      }

      const raw = window.localStorage.getItem('guestCart');
      if (!raw) {
        setCartCount(0);
        return;
      }

      const parsed: unknown = JSON.parse(raw);
      const guestCart = isGuestCartArray(parsed) ? parsed : [];

      const total = guestCart.reduce<number>((sum, it) => {
        const q = Number(it.quantity ?? 1);
        return sum + (Number.isFinite(q) && q > 0 ? q : 1);
      }, 0);

      setCartCount(total);
    } catch (err) {
      console.error('Error loading guest cart count:', err);
      setCartCount(0);
    }
  }, []);

  // 🔹 Dışarıya expose edeceğimiz refetch
  const fetchCartCount = useCallback(() => {
    if (!user?.id) {
      // misafir
      fetchGuestCartCount();
      return;
    }
    // auth user: RTK query'i refetch et
    rtkRefetch();
  }, [user?.id, fetchGuestCartCount, rtkRefetch]);

  // 🔹 data değiştiğinde cartCount hesapla (auth vs guest)
  useEffect(() => {
    if (!user?.id) {
      // misafir: sadece localStorage
      fetchGuestCartCount();
      return;
    }

    const rows: PublicCartItem[] = Array.isArray(userCartItems) ? userCartItems : [];

    const total = rows.reduce<number>((sum, item) => {
      const opts = item.products?.quantity_options;
      const hasQuantityOptions = Array.isArray(opts) && opts.length > 0;

      const q = Number(item.quantity ?? 0);
      const safeQty = Number.isFinite(q) && q > 0 ? q : 0;

      // quantity_options varsa her satırı 1 ürün gibi say
      return sum + (hasQuantityOptions ? 1 : safeQty);
    }, 0);

    setCartCount(total);
  }, [user?.id, userCartItems, fetchGuestCartCount]);

  // 🔹 guestCartUpdated event ile misafir sepetini reaktif yap
  useEffect(() => {
    if (!user?.id && typeof window !== 'undefined') {
      fetchGuestCartCount();

      const onGuestCartUpdate = () => fetchGuestCartCount();
      window.addEventListener('guestCartUpdated', onGuestCartUpdate);

      return () => {
        window.removeEventListener('guestCartUpdated', onGuestCartUpdate);
      };
    }

    return;
  }, [user?.id, fetchGuestCartCount]);

  // 🔹 loading: auth ise RTK loading, misafir ise false
  const loading = !!user?.id && rtkLoading;

  return { cartCount, loading, refetch: fetchCartCount };
};
