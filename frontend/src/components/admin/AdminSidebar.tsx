import { useNavigate } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
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
  RefreshCw,
} from "lucide-react";

const menuGroups = [
  {
    label: "Genel",
    items: [
      { title: "Dashboard", icon: BarChart3, value: "dashboard", path: "/admin" },
      { title: "Raporlar", icon: TrendingUp, value: "reports", path: "/admin/reports" },
      { title: "Ana Sayfa Ayarları", icon: Home, value: "home-settings", path: "/admin/home-settings" },
    ],
  },
  {
    label: "İçerik Yönetimi",
    items: [
      { title: "Ürünler", icon: Package, value: "products", path: "/admin/products" },
      { title: "Kategoriler", icon: FolderTree, value: "categories", path: "/admin/categories" },
      { title: "Blog", icon: FileText, value: "blog", path: "/admin/blog" },
      { title: "Sayfalar", icon: FileText, value: "pages", path: "/admin/pages" },
      { title: "Menü", icon: Menu, value: "menu", path: "/admin/menu" },
      { title: "Popup'lar", icon: MessageSquare, value: "popups", path: "/admin/popups" },
      { title: "Sahte Bildirimler", icon: Bell, value: "fake-notifications", path: "/admin/fake-notifications" },
      { title: "İletişim Formları", icon: MessageSquare, value: "contacts", path: "/admin/contacts" },
    ],
  },
  {
    label: "Sipariş & Finans",
    items: [
      { title: "Siparişler", icon: ShoppingCart, value: "orders", path: "/admin/orders" },
      { title: "Kuponlar", icon: Ticket, value: "coupons", path: "/admin/coupons" },
      { title: "Cüzdan Talepleri", icon: Wallet, value: "deposit-requests", path: "/admin/deposit-requests" },
      { title: "Ödeme Talepleri", icon: CreditCard, value: "payment-requests", path: "/admin/payment-requests" },
    ],
  },
  {
    label: "API & Sistem",
    items: [
      { title: "API Sağlayıcıları", icon: Blocks, value: "api-providers", path: "/admin/api-providers" },
      { title: "Turkpin Ayarları", icon: Settings, value: "turkpin-settings", path: "/admin/turkpin-settings" },
      { title: "Destek Talepleri", icon: Headphones, value: "tickets", path: "/admin/tickets" },
      { title: "Kullanıcılar", icon: Users, value: "users", path: "/admin/users" },
      { title: "Email Şablonları", icon: Mail, value: "email-templates", path: "/admin/email-templates" },
    ],
  },
  {
    label: "Ayarlar",
    items: [
      { title: "Genel Ayarlar", icon: Settings, value: "settings", path: "/admin/settings" },
      { title: "Yedekleme", icon: Database, value: "backup", path: "/admin/backup" },
    ],
  },
];

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const isCollapsed = state === "collapsed";

  const handleLogout = async () => {
    try {
      await metahub.auth.signOut();
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

  return (
    <Sidebar className={isCollapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent>
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">D</span>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">Dijital Market</p>
              </div>
            )}
          </div>
        </div>

        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => {
                        if (item.value === "dashboard") {
                          navigate("/admin");
                        } else {
                          navigate(item.path);
                        }
                      }}
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

        <div className="mt-auto p-4 border-t space-y-2">
          <SidebarMenuButton onClick={() => navigate("/")}>
            <Home className="h-4 w-4" />
            {!isCollapsed && <span>Ana Sayfaya Dön</span>}
          </SidebarMenuButton>
          <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4" />
            {!isCollapsed && <span>Çıkış Yap</span>}
          </SidebarMenuButton>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
