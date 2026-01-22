// =============================================================
// FILE: src/components/layout/Navbar.tsx
// FINAL — Admin check fix: useAuth().isAdmin (NOT admin roles endpoint)
// =============================================================

import { useState, useEffect, useMemo, type ComponentType, type SVGProps } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User as UserIcon,
  Menu,
  X,
  Moon,
  Sun,
  LogOut,
  Home,
  ShoppingBag,
  Grid3x3,
  Info,
  Mail,
  BookOpen,
  LifeBuoy,
  Bell,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { Topbar } from './Topbar';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useNotifications } from '@/hooks/useNotifications';
import {
  useGetMyProfileQuery,
  useListMenuItemsQuery,
  useGetSiteSettingByKeyQuery,
} from '@/integrations/hooks';

/** ---- Icon map'i typesafe ---- */
const ICONS = { Home, ShoppingBag, Grid3x3, Info, Mail, BookOpen, LifeBuoy } as const;
type IconKey = keyof typeof ICONS;
type IconCmp = ComponentType<SVGProps<SVGSVGElement>>;
const getMenuIcon = (iconName: string | null): IconCmp | null => {
  if (!iconName) return null;
  const key = iconName as IconKey;
  return ICONS[key] ?? null;
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [themeMode, setThemeMode] = useState<'user_choice' | 'dark_only' | 'light_only'>(
    'user_choice',
  );

  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  // ✅ Admin kontrolünü buradan al
  const { user, signOut, isAdmin } = useAuth();

  const { cartCount } = useCart();
  const { unreadCount } = useNotifications();

  const { data: profile } = useGetMyProfileQuery(undefined, { skip: !user });

  const { data: menuItemsData } = useListMenuItemsQuery({
    location: 'header',
    is_active: true,
    limit: 50,
  });
  const menuItems = menuItemsData ?? [];

  const { data: themeSetting } = useGetSiteSettingByKeyQuery('theme_mode');

  useEffect(() => {
    if (!themeSetting?.value) return;
    const mode = themeSetting.value as 'user_choice' | 'dark_only' | 'light_only';
    setThemeMode(mode);
    if (mode === 'dark_only') setTheme('dark');
    if (mode === 'light_only') setTheme('light');
  }, [themeSetting, setTheme]);

  const displayName = useMemo(() => {
    if (!user) return '';

    const fromProfile =
      profile?.full_name?.trim() ||
      ''
        .concat(
          (profile as any)?.first_name ? String((profile as any).first_name).trim() : '',
          ' ',
          (profile as any)?.last_name ? String((profile as any).last_name).trim() : '',
        )
        .trim();

    if (fromProfile) return fromProfile;

    const meta = (
      user as {
        user_metadata?: { full_name?: string | null; name?: string | null } | null;
        full_name?: string | null;
        email?: string | null;
      }
    )?.user_metadata;

    const metaName =
      meta?.full_name?.trim() || meta?.name?.trim() || (user as any)?.full_name?.trim() || '';

    if (metaName) return metaName;

    return user.email || '';
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
    setIsUserMenuOpen(false);
    navigate('/');
  };

  const go = (path: string) => {
    setIsUserMenuOpen(false);
    navigate(path);
  };

  return (
    <>
      <Topbar />
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">D</span>
              </div>
              <span className="font-bold text-xl">Dijital Market</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => {
                const IconComponent = getMenuIcon(item.icon as string | null);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.url)}
                    className="text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {item.title}
                  </button>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {themeMode === 'user_choice' && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="hidden md:flex"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate('/sepet')}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {user && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate('/hesabim?tab=notifications')}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-[4px]">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              )}

              {user ? (
                <DropdownMenu modal={false} open={isUserMenuOpen} onOpenChange={setIsUserMenuOpen}>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="icon" aria-label="Kullanıcı menüsü">
                      <UserIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    side="bottom"
                    align="end"
                    sideOffset={12}
                    avoidCollisions
                    collisionPadding={16}
                    className="z-[9999] min-w-[220px]"
                  >
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{displayName}</span>
                        {displayName !== user.email && (
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={() => go('/hesabim')}>Hesabım</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => go('/destek')}>Destek</DropdownMenuItem>

                    {/* ✅ Artık doğru admin flag */}
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => go('/admin')}>Yönetim</DropdownMenuItem>
                    )}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate('/giris')}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Button>

                  <Button
                    type="button"
                    className="hidden md:flex gradient-primary text-white"
                    onClick={() => navigate('/giris')}
                  >
                    Giriş Yap
                  </Button>
                </>
              )}

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen((v) => !v)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                {menuItems.map((item) => {
                  const IconComponent = getMenuIcon(item.icon as string | null);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => navigate(item.url)}
                      className="text-left text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2"
                    >
                      {IconComponent && <IconComponent className="h-4 w-4" />}
                      {item.title}
                    </button>
                  );
                })}

                {user ? (
                  <Button
                    type="button"
                    className="gradient-primary text-white w-full"
                    onClick={handleSignOut}
                  >
                    Çıkış Yap
                  </Button>
                ) : (
                  <Button
                    type="button"
                    className="gradient-primary text-white w-full"
                    onClick={() => navigate('/giris')}
                  >
                    Giriş Yap
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
