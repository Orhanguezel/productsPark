// src/components/layout/Navbar.tsx
import {
  useState,
  useEffect,
  useMemo,
  type ComponentType,
  type SVGProps,
} from "react";
import { useNavigate } from "react-router-dom";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { Topbar } from "./Topbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useNotifications } from "@/hooks/useNotifications";
import { useGetMyProfileQuery } from "@/integrations/metahub/rtk/endpoints/profiles.endpoints";
import { useListMenuItemsQuery } from "@/integrations/metahub/rtk/endpoints/menu_items.endpoints";
import { useListUserRolesQuery } from "@/integrations/metahub/rtk/endpoints/user_roles.endpoints";
import { useGetSiteSettingByKeyQuery } from "@/integrations/metahub/rtk/endpoints/site_settings.endpoints";

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
  const [themeMode, setThemeMode] = useState<
    "user_choice" | "dark_only" | "light_only"
  >("user_choice");

  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();

  // 🔔 Notifications (sadece sayı için yeterli)
  const { unreadCount } = useNotifications();

  // 👤 Profil (RTK)
  const { data: profile } = useGetMyProfileQuery(undefined, {
    skip: !user,
  });

  // 📋 Menu items (header için)
  const { data: menuItemsData } = useListMenuItemsQuery({
    location: "header",
    is_active: true,
    limit: 50,
  });
  const menuItems = menuItemsData ?? [];

  // 🛡 Admin rolü kontrolü
  const { data: rolesData } = useListUserRolesQuery(
    user?.id
      ? { user_id: user.id, role: "admin", limit: 1, offset: 0 }
      : undefined,
    { skip: !user?.id },
  );
  const isAdmin = !!rolesData?.length;

  // 🎨 Tema ayarı (site_settings.theme_mode)
  const { data: themeSetting } = useGetSiteSettingByKeyQuery("theme_mode");

  useEffect(() => {
    if (!themeSetting?.value) return;
    const mode = themeSetting
      .value as "user_choice" | "dark_only" | "light_only";
    setThemeMode(mode);
    if (mode === "dark_only") setTheme("dark");
    else if (mode === "light_only") setTheme("light");
  }, [themeSetting, setTheme]);

  /** ---- Display name resolve (profile → user_metadata → user.full_name → email) ---- */
  const displayName = useMemo(() => {
    if (!user) return "";

    // 1) profiles tablosu
    const fromProfile =
      profile?.full_name?.trim() ||
      ""
        .concat(
          (profile as any)?.first_name
            ? String((profile as any).first_name).trim()
            : "",
          " ",
          (profile as any)?.last_name
            ? String((profile as any).last_name).trim()
            : "",
        )
        .trim();

    if (fromProfile) return fromProfile;

    // 2) user_metadata + user.full_name fallback
    const meta = (user as {
      user_metadata?: { full_name?: string | null; name?: string | null } | null;
      full_name?: string | null;
      email?: string | null;
    })?.user_metadata;

    const metaName =
      meta?.full_name?.trim() ||
      meta?.name?.trim() ||
      (user as any)?.full_name?.trim() ||
      "";

    if (metaName) return metaName;

    // 3) email fallback
    return user.email || "";
  }, [user, profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
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
                <span className="text-primary-foreground font-bold text-sm">
                  D
                </span>
              </div>
              <span className="font-bold text-xl">Dijital Market</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-6">
              {menuItems.map((item) => {
                const IconComponent = getMenuIcon(item.icon as string | null);
                return (
                  <a
                    key={item.id}
                    href={item.url}
                    className="text-sm font-medium hover:text-primary transition-smooth flex items-center gap-2"
                  >
                    {IconComponent && <IconComponent className="h-4 w-4" />}
                    {item.title}
                  </a>
                );
              })}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3">
              {/* Tema toggle (sadece user_choice ise göster) */}
              {themeMode === "user_choice" && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hidden md:flex"
                >
                  {theme === "dark" ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </Button>
              )}

              {/* Sepet */}
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={() => navigate("/sepet")}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {/* Notifications (sadece login kullanıcı için) */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate("/hesabim?tab=notifications")}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[10px] rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-[4px]">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              )}

              {/* Kullanıcı menüsü */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <UserIcon className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="font-medium">{displayName}</span>
                        {displayName !== user.email && (
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/hesabim")}>
                      Hesabım
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/destek")}>
                      Destek
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate("/admin")}>
                        Yönetim
                      </DropdownMenuItem>
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
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/giris")}
                  >
                    <UserIcon className="h-5 w-5" />
                  </Button>

                  <Button
                    className="hidden md:flex gradient-primary text-white"
                    onClick={() => navigate("/giris")}
                  >
                    Giriş Yap
                  </Button>
                </>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen((v) => !v)}
              >
                {isMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
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
                    className="gradient-primary text-white w-full"
                    onClick={handleSignOut}
                  >
                    Çıkış Yap
                  </Button>
                ) : (
                  <Button
                    className="gradient-primary text-white w-full"
                    onClick={() => navigate("/giris")}
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
