// =============================================================
// FILE: src/components/admin/AdminLayout.tsx
// =============================================================

import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AdminSidebar, type MenuValue } from './AdminSidebar';
import { ModeToggle } from '@/components/ModeToggle';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
    if (path.includes('/payments')) return 'payments';

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
    /* Tüm sayfa — ekranı doldur, dışarı taşma yok */
    <div className="h-screen w-full flex overflow-hidden bg-background">

      {/* Sidebar */}
      <AdminSidebar
        activeTab={getActiveTab()}
        onTabChange={() => {}}
        isOpen={sidebarOpen}
      />

      {/* Sağ taraf: header + içerik */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="h-16 flex-shrink-0 border-b flex items-center justify-between px-4 bg-background z-10">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen((v) => !v)}
              className="h-8 w-8"
            >
              <PanelLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold truncate">{title}</h1>
          </div>
          <ModeToggle />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
