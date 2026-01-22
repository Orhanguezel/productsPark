// =============================================================
// FILE: src/components/admin/AdminLayout.tsx
// FINAL — Admin Layout (status/roles + MenuValue + Telegram tab support)
// =============================================================

import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar, type MenuValue } from './AdminSidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ModeToggle } from '@/components/ModeToggle';

import { useStatusQuery } from '@/integrations/hooks';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

const hasAdminRole = (roles: unknown): boolean => {
  if (!Array.isArray(roles)) return false;
  return roles.some((r) => String(r).toLowerCase() === 'admin');
};

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  const { data: statusData, isLoading: statusLoading } = useStatusQuery();

  const getActiveTab = (): MenuValue => {
    const path = location.pathname;

    if (path.includes('/reports')) return 'reports';
    if (path.includes('/home-settings')) return 'home-settings';

    if (path.includes('/products')) return 'products';
    if (path.includes('/categories')) return 'categories';
    if (path.includes('/blog')) return 'blog';
    if (path.includes('/pages')) return 'pages';
    if (path.includes('/menu')) return 'menu';
    if (path.includes('/popups')) return 'popups';
    if (path.includes('/fake-notifications')) return 'fake-notifications';

    if (path.includes('/orders')) return 'orders';
    if (path.includes('/coupons')) return 'coupons';
    if (path.includes('/deposit-requests')) return 'deposit-requests';
    if (path.includes('/payment-requests')) return 'payment-requests';
    if (path.includes('/wallet-transactions')) return 'wallet-transactions';

    if (path.includes('/tickets')) return 'tickets';
    if (path.includes('/contacts')) return 'contacts';
    if (path.includes('/users')) return 'users';

    if (path.includes('/email-templates')) return 'email-templates';
    if (path.includes('/api-providers')) return 'api-providers';
    if (path.includes('/turkpin-settings')) return 'turkpin-settings';
    if (path.includes('/telegram')) return 'telegram';

    if (path.includes('/backup')) return 'backup';
    if (path.includes('/settings')) return 'settings';

    return 'dashboard';
  };

  const isAdmin: boolean = (() => {
    if (hasAdminRole(statusData?.user?.roles)) return true;

    const role = (user as any)?.role;
    if (typeof role === 'string' && role.toLowerCase() === 'admin') return true;

    const roles = (user as any)?.roles;
    if (hasAdminRole(roles)) return true;

    return false;
  })();

  useEffect(() => {
    if (authLoading || statusLoading) return;

    if (!user) {
      navigate('/giris', { replace: true });
      return;
    }

    if (!isAdmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, statusLoading, user, isAdmin, navigate]);

  if (authLoading || statusLoading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  if (!user || !isAdmin) return null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AdminSidebar activeTab={getActiveTab()} onTabChange={() => {}} />

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <ModeToggle />
          </header>

          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
