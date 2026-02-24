// =============================================================
// FILE: src/components/admin/AdminSidebar.tsx
// =============================================================

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { toast } from '@/hooks/use-toast';
import {
  BarChart3,
  ShoppingCart,
  Package,
  Users,
  Settings,
  LogOut,
  Home,
  FileText,
  Ticket,
  TrendingUp,
  FolderTree,
  Bell,
  Menu,
  MessageSquare,
  Headphones,
  CreditCard,
  Wallet,
  Blocks,
  Database,
  Mail,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthLogoutMutation, useGetSiteSettingByKeyQuery } from '@/integrations/hooks';

export type MenuValue =
  | 'dashboard'
  | 'reports'
  | 'home-settings'
  | 'products'
  | 'categories'
  | 'blog'
  | 'pages'
  | 'menu'
  | 'popups'
  | 'fake-notifications'
  | 'contacts'
  | 'orders'
  | 'coupons'
  | 'deposit-requests'
  | 'payment-requests'
  | 'wallet-transactions'
  | 'payments'
  | 'tickets'
  | 'users'
  | 'email-templates'
  | 'api-providers'
  | 'turkpin-settings'
  | 'telegram'
  | 'settings'
  | 'backup';

const menuGroups: {
  label: string;
  items: { title: string; icon: React.ComponentType<{ className?: string | undefined }>; value: MenuValue }[];
}[] = [
  {
    label: 'Genel',
    items: [
      { title: 'Dashboard', icon: BarChart3, value: 'dashboard' },
      { title: 'Raporlar', icon: TrendingUp, value: 'reports' },
      { title: 'Ana Sayfa Ayarları', icon: Home, value: 'home-settings' },
      { title: 'Genel Ayarlar', icon: Settings, value: 'settings' },
    ],
  },
  {
    label: 'Katalog & İçerik',
    items: [
      { title: 'Ürünler', icon: Package, value: 'products' },
      { title: 'Kategoriler', icon: FolderTree, value: 'categories' },
      { title: 'Blog', icon: FileText, value: 'blog' },
      { title: 'Sayfalar', icon: FileText, value: 'pages' },
      { title: 'Menü', icon: Menu, value: 'menu' },
      { title: "Popup'lar", icon: MessageSquare, value: 'popups' },
      { title: 'Sahte Bildirimler', icon: Bell, value: 'fake-notifications' },
    ],
  },
  {
    label: 'Sipariş & Finans',
    items: [
      { title: 'Siparişler', icon: ShoppingCart, value: 'orders' },
      { title: 'Kuponlar', icon: Ticket, value: 'coupons' },
      { title: 'Cüzdan Talepleri', icon: Wallet, value: 'deposit-requests' },
      { title: 'Ödeme Talepleri', icon: CreditCard, value: 'payment-requests' },
      { title: 'Ödeme Ayarları', icon: CreditCard, value: 'payments' },
    ],
  },
  {
    label: 'Destek & İletişim',
    items: [
      { title: 'Destek Talepleri', icon: Headphones, value: 'tickets' },
      { title: 'İletişim Formları', icon: MessageSquare, value: 'contacts' },
      { title: 'Kullanıcılar', icon: Users, value: 'users' },
    ],
  },
  {
    label: 'Entegrasyon & Sistem',
    items: [
      { title: 'Telegram', icon: Send, value: 'telegram' },
      { title: 'Email Şablonları', icon: Mail, value: 'email-templates' },
      { title: 'API Sağlayıcıları', icon: Blocks, value: 'api-providers' },
      { title: 'Turkpin Ayarları', icon: Settings, value: 'turkpin-settings' },
    ],
  },
  {
    label: 'Sistem',
    items: [{ title: 'Yedekleme', icon: Database, value: 'backup' }],
  },
];

const routeMap: Record<MenuValue, string> = {
  dashboard: '/admin',
  reports: '/admin/reports',
  'home-settings': '/admin/home-settings',
  products: '/admin/products',
  categories: '/admin/categories',
  blog: '/admin/blog',
  pages: '/admin/pages',
  menu: '/admin/menu',
  popups: '/admin/popups',
  'fake-notifications': '/admin/fake-notifications',
  contacts: '/admin/contacts',
  orders: '/admin/orders',
  coupons: '/admin/coupons',
  'deposit-requests': '/admin/deposit-requests',
  'payment-requests': '/admin/payment-requests',
  'wallet-transactions': '/admin/wallet-transactions',
  payments: '/admin/payments',
  tickets: '/admin/tickets',
  users: '/admin/users',
  'email-templates': '/admin/email-templates',
  'api-providers': '/admin/api-providers',
  'turkpin-settings': '/admin/turkpin-settings',
  telegram: '/admin/telegram',
  settings: '/admin/settings',
  backup: '/admin/backup',
};

interface AdminSidebarProps {
  activeTab: MenuValue;
  onTabChange?: (value: MenuValue) => void;
  isOpen?: boolean;
}

export function AdminSidebar({ activeTab, onTabChange, isOpen = true }: AdminSidebarProps) {
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const { data: lightLogoSetting } = useGetSiteSettingByKeyQuery('light_logo');
  const { data: darkLogoSetting } = useGetSiteSettingByKeyQuery('dark_logo');
  const { data: siteNameSetting } = useGetSiteSettingByKeyQuery('site_name');

  const siteName = (siteNameSetting?.value as string) || 'Admin';
  const logoUrl = isDark
    ? ((darkLogoSetting?.value as string) || (lightLogoSetting?.value as string) || '')
    : ((lightLogoSetting?.value as string) || '');

  const [logout, { isLoading: logoutLoading }] = useAuthLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast({ title: 'Çıkış Yapıldı', description: 'Başarıyla çıkış yaptınız.' });
      navigate('/giris');
    } catch {
      toast({ title: 'Hata', description: 'Çıkış yapılırken bir hata oluştu.', variant: 'destructive' });
    }
  };

  const handleMenuClick = (value: MenuValue) => {
    onTabChange?.(value);
    navigate(routeMap[value]);
  };

  return (
    <aside
      style={{ width: isOpen ? 256 : 64 }}
      className={cn(
        'flex-shrink-0 flex flex-col',
        'border-r bg-card dark:bg-card',
        'overflow-hidden',
        'transition-[width] duration-200 ease-in-out',
      )}
    >
      {/* Brand */}
      <div className={cn(
        'border-b flex-shrink-0 overflow-hidden',
        isOpen ? 'px-4 py-4 flex flex-col items-center gap-2' : 'h-16 flex items-center justify-center px-2',
      )}>
        {logoUrl ? (
          <>
            <img
              src={logoUrl}
              alt={siteName}
              className={isOpen ? 'h-12 w-auto max-w-full object-contain' : 'h-8 w-8 object-contain'}
            />
            {isOpen && (
              <div className="text-center">
                <p className="text-sm font-semibold leading-tight">{siteName}</p>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className={cn(
              'bg-primary rounded-lg flex items-center justify-center flex-shrink-0',
              isOpen ? 'w-12 h-12' : 'w-8 h-8',
            )}>
              <span className={cn('text-primary-foreground font-bold', isOpen ? 'text-lg' : 'text-sm')}>
                {siteName.charAt(0).toUpperCase()}
              </span>
            </div>
            {isOpen && (
              <div className="text-center">
                <h2 className="font-bold text-sm leading-tight">{siteName}</h2>
                <p className="text-xs text-muted-foreground">Admin Panel</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Menu — scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {menuGroups.map((group) => (
          <div key={group.label} className="mb-1">
            {isOpen && (
              <p className="px-4 pt-2 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                {group.label}
              </p>
            )}
            {!isOpen && <div className="my-1 mx-2 h-px bg-border" />}
            <div className="px-2 space-y-0.5">
              {group.items.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => handleMenuClick(item.value)}
                  title={item.title}
                  className={cn(
                    'w-full flex items-center rounded-md px-2 py-2 text-sm transition-colors',
                    isOpen ? 'gap-2 justify-start' : 'justify-center',
                    activeTab === item.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground',
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {isOpen && <span className="truncate whitespace-nowrap">{item.title}</span>}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-2 border-t flex-shrink-0 space-y-0.5">
        <button
          type="button"
          onClick={() => navigate('/')}
          title="Ana Sayfaya Dön"
          className={cn(
            'w-full flex items-center rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground text-foreground',
            isOpen ? 'gap-2 justify-start' : 'justify-center',
          )}
        >
          <Home className="h-4 w-4 flex-shrink-0" />
          {isOpen && <span className="whitespace-nowrap">Ana Sayfaya Dön</span>}
        </button>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutLoading}
          title="Çıkış Yap"
          className={cn(
            'w-full flex items-center rounded-md px-2 py-2 text-sm transition-colors text-destructive hover:bg-destructive/10',
            isOpen ? 'gap-2 justify-start' : 'justify-center',
          )}
        >
          <LogOut className="h-4 w-4 flex-shrink-0" />
          {isOpen && <span className="whitespace-nowrap">Çıkış Yap</span>}
        </button>
      </div>
    </aside>
  );
}
