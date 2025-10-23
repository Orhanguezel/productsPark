import { useState, useEffect } from "react";
import { ShoppingCart, User, Menu, X, Moon, Sun, LogOut, Home, ShoppingBag, Grid3x3, Info, Mail, BookOpen, LifeBuoy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { metahub } from "@/integrations/metahub/client";
import { Topbar } from "./Topbar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MenuItem {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  is_active: boolean;
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [themeMode, setThemeMode] = useState<'user_choice' | 'dark_only' | 'light_only'>('user_choice');
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { cartCount } = useCart();

  useEffect(() => {
    fetchMenuItems();
    checkAdminStatus();
    fetchThemeSettings();
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) {
      setIsAdmin(false);
      return;
    }

    const { data } = await metahub
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    setIsAdmin(!!data);
  };

  const fetchMenuItems = async () => {
    const { data } = await metahub
      .from("menu_items")
      .select("id, title, url, icon, is_active")
      .eq("location", "header")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (data) {
      setMenuItems(data);
    }
  };

  const fetchThemeSettings = async () => {
    const { data } = await metahub
      .from("site_settings")
      .select("value")
      .eq("key", "theme_mode")
      .maybeSingle();

    if (data?.value) {
      const mode = data.value as 'user_choice' | 'dark_only' | 'light_only';
      setThemeMode(mode);

      // Force theme based on setting
      if (mode === 'dark_only') {
        setTheme('dark');
      } else if (mode === 'light_only') {
        setTheme('light');
      }
    }
  };

  const getMenuIcon = (iconName: string | null) => {
    if (!iconName) return null;

    const iconMap: { [key: string]: any } = {
      'Home': Home,
      'ShoppingBag': ShoppingBag,
      'Grid3x3': Grid3x3,
      'Info': Info,
      'Mail': Mail,
      'BookOpen': BookOpen,
      'LifeBuoy': LifeBuoy,
    };

    return iconMap[iconName] || null;
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/";
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
                const IconComponent = getMenuIcon(item.icon);
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
              {themeMode === 'user_choice' && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className="hidden md:flex"
                >
                  {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>
              )}

              <Button variant="ghost" size="icon" className="relative" onClick={() => window.location.href = "/sepet"}>
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </Button>

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>
                      {user.user_metadata?.full_name || user.email}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => window.location.href = "/hesabim"}>
                      Hesabım
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => window.location.href = "/destek"}>
                      Destek
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => window.location.href = "/admin"}>
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
                  <Button variant="ghost" size="icon" onClick={() => window.location.href = "/giris"}>
                    <User className="h-5 w-5" />
                  </Button>

                  <Button className="hidden md:flex gradient-primary text-white" onClick={() => window.location.href = "/giris"}>
                    Giriş Yap
                  </Button>
                </>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-border">
              <div className="flex flex-col gap-4">
                {menuItems.map((item) => {
                  const IconComponent = getMenuIcon(item.icon);
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
                {user ? (
                  <Button className="gradient-primary text-white w-full" onClick={handleSignOut}>
                    Çıkış Yap
                  </Button>
                ) : (
                  <Button className="gradient-primary text-white w-full" onClick={() => window.location.href = "/giris"}>
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
