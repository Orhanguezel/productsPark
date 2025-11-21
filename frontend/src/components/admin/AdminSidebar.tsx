// =============================================================
// FILE: src/components/admin/AdminSidebar.tsx  (FIXED - navigate + tab)
// =============================================================
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
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
} from "lucide-react";

// ✅ RTK Auth logout
import { useLogoutMutation } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";

type MenuValue =
  | "dashboard"
  | "reports"
  | "home-settings"
  | "products"
  | "categories"
  | "blog"
  | "pages"
  | "menu"
  | "popups"
  | "fake-notifications"
  | "contacts"
  | "orders"
  | "coupons"
  | "deposit-requests"
  | "payment-requests"
  | "api-providers"
  | "turkpin-settings"
  | "tickets"
  | "users"
  | "email-templates"
  | "settings"
  | "backup";

const menuGroups: {
  label: string;
  items: { title: string; icon: React.ComponentType<any>; value: MenuValue }[];
}[] = [
  {
    label: "Genel",
    items: [
      { title: "Dashboard", icon: BarChart3, value: "dashboard" },
      { title: "Raporlar", icon: TrendingUp, value: "reports" },
      { title: "Ana Sayfa Ayarları", icon: Home, value: "home-settings" },
    ],
  },
  {
    label: "İçerik Yönetimi",
    items: [
      { title: "Ürünler", icon: Package, value: "products" },
      { title: "Kategoriler", icon: FolderTree, value: "categories" },
      { title: "Blog", icon: FileText, value: "blog" },
      { title: "Sayfalar", icon: FileText, value: "pages" },
      { title: "Menü", icon: Menu, value: "menu" },
      { title: "Popup'lar", icon: MessageSquare, value: "popups" },
      { title: "Sahte Bildirimler", icon: Bell, value: "fake-notifications" },
      { title: "İletişim Formları", icon: MessageSquare, value: "contacts" },
    ],
  },
  {
    label: "Sipariş & Finans",
    items: [
      { title: "Siparişler", icon: ShoppingCart, value: "orders" },
      { title: "Kuponlar", icon: Ticket, value: "coupons" },
      { title: "Cüzdan Talepleri", icon: Wallet, value: "deposit-requests" },
      { title: "Ödeme Talepleri", icon: CreditCard, value: "payment-requests" },
    ],
  },
  {
    label: "API & Sistem",
    items: [
      { title: "API Sağlayıcıları", icon: Blocks, value: "api-providers" },
      { title: "Turkpin Ayarları", icon: Settings, value: "turkpin-settings" },
      { title: "Destek Talepleri", icon: Headphones, value: "tickets" },
      { title: "Kullanıcılar", icon: Users, value: "users" },
      { title: "Email Şablonları", icon: Mail, value: "email-templates" },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { title: "Genel Ayarlar", icon: Settings, value: "settings" },
      { title: "Yedekleme", icon: Database, value: "backup" },
    ],
  },
];

// ✅ value -> route map
const routeMap: Record<MenuValue, string> = {
  dashboard: "/admin",
  reports: "/admin/reports",
  "home-settings": "/admin/home-settings",

  products: "/admin/products",
  categories: "/admin/categories",
  blog: "/admin/blog",
  pages: "/admin/pages",
  menu: "/admin/menu",
  popups: "/admin/popups",
  "fake-notifications": "/admin/fake-notifications",
  contacts: "/admin/contacts",

  orders: "/admin/orders",
  coupons: "/admin/coupons",
  "deposit-requests": "/admin/deposit-requests",
  "payment-requests": "/admin/payment-requests",

  "api-providers": "/admin/api-providers",
  "turkpin-settings": "/admin/turkpin-settings",
  tickets: "/admin/tickets",
  users: "/admin/users",
  "email-templates": "/admin/email-templates",

  settings: "/admin/settings",
  backup: "/admin/backup",
};

interface AdminSidebarProps {
  activeTab: MenuValue;
  onTabChange?: (value: MenuValue) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  // ✅ RTK logout hook
  const [logout, { isLoading: logoutLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast({
        title: "Çıkış Yapıldı",
        description: "Başarıyla çıkış yaptınız.",
      });
      navigate("/giris");
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        title: "Hata",
        description: "Çıkış yapılırken bir hata oluştu.",
        variant: "destructive",
      });
    }
  };

  const handleMenuClick = (value: MenuValue) => {
    // Tab state kullanan layout'lara bilgi ver
    if (onTabChange) {
      onTabChange(value);
    }

    // Route değiştir
    const path = routeMap[value];
    if (path) {
      navigate(path);
    }
  };

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo / Title */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">
                D
              </span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">
                  Dijital Market
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Menu groups */}
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      type="button"
                      onClick={() => handleMenuClick(item.value)}
                      className={
                        activeTab === item.value
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : ""
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}

        {/* Footer actions */}
        <div className="mt-auto p-4 border-t space-y-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={() => navigate("/")}>
                <Home className="h-4 w-4" />
                {!isCollapsed && <span>Ana Sayfaya Dön</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={handleLogout}
                disabled={logoutLoading}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4" />
                {!isCollapsed && <span>Çıkış Yap</span>}
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
