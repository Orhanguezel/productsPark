import { useEffect, useState, useCallback } from 'react';
import { metahub } from '@/integrations/metahub/client';
import { useAuth } from '@/hooks/useAuth';
import type { CartItemRow } from '@/integrations/metahub/db/types/orders';

type GuestCartItem = { quantity?: number };

// BE'den sadece ihtiyaç duyduğumuz alanlar
type CartCountRow = Pick<CartItemRow, 'quantity' | 'products'>;

// Realtime tipi (opsiyonel — mevcutsa kullanılır)
type PostgresEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';
type PostgresFilter = { event: PostgresEvent; schema: string; table: string; filter?: string };

interface RealtimeChannel {
  on: (event: 'postgres_changes', filter: PostgresFilter, cb: () => void) => RealtimeChannel;
  subscribe: () => unknown;
}
interface RealtimeClient {
  channel: (name: string) => RealtimeChannel;
  removeChannel: (ch: RealtimeChannel) => void;
}

const isRealtimeClient = (x: unknown): x is RealtimeClient =>
  typeof (x as { channel?: unknown }).channel === 'function' &&
  typeof (x as { removeChannel?: unknown }).removeChannel === 'function';

const isGuestCartArray = (x: unknown): x is GuestCartItem[] =>
  Array.isArray(x) &&
  x.every((i) => {
    if (typeof i !== 'object' || i === null) return false;
    // quantity yoksa da kabul; varsa number olmalı
    const q = (i as { quantity?: unknown }).quantity;
    return typeof q === 'undefined' || typeof q === 'number';
  });

export const useCart = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchGuestCartCount = useCallback(() => {
    try {
      const raw = localStorage.getItem('guestCart');
      if (!raw) {
        setCartCount(0);
        return;
      }
      const parsed: unknown = JSON.parse(raw);
      const guestCart = isGuestCartArray(parsed) ? parsed : [];
      const total = guestCart.reduce<number>((sum, it) => sum + (Number(it.quantity ?? 1) || 1), 0);
      setCartCount(total);
    } catch (err) {
      console.error('Error loading guest cart count:', err);
      setCartCount(0);
    }
  }, []);

  const fetchCartCount = useCallback(async () => {
    if (!user?.id) {
      fetchGuestCartCount();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await metahub
        .from<CartCountRow>('cart_items')
        .select('quantity, products(quantity_options)')
        .eq('user_id', user.id);

      if (error) throw error;

      const rows: CartCountRow[] = Array.isArray(data) ? data : [];
      const total = rows.reduce<number>((sum, item) => {
        const opts = item.products?.quantity_options;
        const hasQuantityOptions = Array.isArray(opts) && opts.length > 0;
        const q = Number(item.quantity ?? 0);
        return sum + (hasQuantityOptions ? 1 : q);
      }, 0);

      setCartCount(total);
    } catch (err) {
      console.error('Error fetching cart count:', err);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id, fetchGuestCartCount]);

  useEffect(() => {
    if (user?.id) {
      // İlk yükleme
      fetchCartCount();

      // Realtime varsa dinle
      let ch: RealtimeChannel | null = null;
      if (isRealtimeClient(metahub)) {
        ch = metahub
          .channel('cart-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'cart_items', filter: `user_id=eq.${user.id}` },
            () => {
              // Değişimde yeniden say
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
            console.warn('removeChannel failed:', e);
          }
        }
      };
    } else {
      // Misafir sepet
      fetchGuestCartCount();

      const onGuestCartUpdate = () => fetchGuestCartCount();
      window.addEventListener('guestCartUpdated', onGuestCartUpdate);
      return () => window.removeEventListener('guestCartUpdated', onGuestCartUpdate);
    }
  }, [user?.id, fetchCartCount, fetchGuestCartCount]);

  return { cartCount, loading, refetch: fetchCartCount };
};
