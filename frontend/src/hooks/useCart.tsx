import { useEffect, useState } from 'react';
import { metahub } from '@/integrations/metahub/client';
import { useAuth } from '@/hooks/useAuth';

export const useCart = () => {
  const { user } = useAuth();
  const [cartCount, setCartCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCartCount();

      // Subscribe to real-time cart updates
      const channel = metahub
        .channel('cart-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'cart_items',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            console.log('Cart updated, refetching count...');
            fetchCartCount();
          }
        )
        .subscribe();

      return () => {
        metahub.removeChannel(channel);
      };
    } else {
      // Load guest cart count from localStorage
      fetchGuestCartCount();
      setLoading(false);

      // Listen for guest cart updates
      const handleGuestCartUpdate = () => {
        fetchGuestCartCount();
      };
      window.addEventListener('guestCartUpdated', handleGuestCartUpdate);

      return () => {
        window.removeEventListener('guestCartUpdated', handleGuestCartUpdate);
      };
    }
  }, [user]);

  const fetchGuestCartCount = () => {
    try {
      const guestCartData = localStorage.getItem('guestCart');
      if (!guestCartData) {
        setCartCount(0);
        return;
      }

      const guestCart = JSON.parse(guestCartData);
      const totalCount = guestCart.reduce((sum: number, item: unknown) => sum + (item.quantity || 1), 0);
      setCartCount(totalCount);
    } catch (error) {
      console.error('Error loading guest cart count:', error);
      setCartCount(0);
    }
  };

  const fetchCartCount = async () => {
    if (!user) {
      fetchGuestCartCount();
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await metahub
        .from('cart_items')
        .select('quantity, products(quantity_options)')
        .eq('user_id', user.id);

      if (error) throw error;

      // Count items: if product has quantity_options, count as 1, otherwise count quantity
      const totalCount = data?.reduce((sum, item: unknown) => {
        const hasQuantityOptions = item.products?.quantity_options &&
          Array.isArray(item.products.quantity_options) &&
          item.products.quantity_options.length > 0;
        return sum + (hasQuantityOptions ? 1 : item.quantity);
      }, 0) || 0;
      setCartCount(totalCount);
    } catch (error) {
      console.error('Error fetching cart count:', error);
      setCartCount(0);
    } finally {
      setLoading(false);
    }
  };

  return { cartCount, loading, refetch: fetchCartCount };
};
