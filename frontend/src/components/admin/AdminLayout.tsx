// =============================================================
// FILE: src/components/admin/AdminLayout.tsx  (UPDATED)
// =============================================================
import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";

// ✅ RTK auth.status kullan
import { useStatusQuery } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  // Auth status (is_admin + role bilgisi)
  const { data: statusData, isLoading: statusLoading } = useStatusQuery();

  // ---------- Active tab helper ----------
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/reports")) return "reports";
    if (path.includes("/home-settings")) return "home-settings";
    if (path.includes("/products")) return "products";
    if (path.includes("/orders")) return "orders";
    if (path.includes("/categories")) return "categories";
    if (path.includes("/blog")) return "blog";
    if (path.includes("/contacts")) return "contacts";
    if (path.includes("/coupons")) return "coupons";
    if (path.includes("/api-providers")) return "api-providers";
    if (path.includes("/turkpin-settings")) return "turkpin-settings";
    if (path.includes("/popups")) return "popups";
    if (path.includes("/tickets")) return "tickets";
    if (path.includes("/deposit-requests")) return "deposit-requests";
    if (path.includes("/payment-requests")) return "payment-requests";
    if (path.includes("/wallet-transactions")) return "wallet-transactions";
    if (path.includes("/users")) return "users";
    if (path.includes("/pages")) return "pages";
    if (path.includes("/menu")) return "menu";
    if (path.includes("/fake-notifications")) return "fake-notifications";
    if (path.includes("/email-templates")) return "email-templates";
    if (path.includes("/updates")) return "updates";
    if (path.includes("/backup")) return "backup";
    if (path.includes("/settings")) return "settings";
    return "dashboard";
  };

  // ---------- isAdmin: auth.status + user.role/roles ----------
  const isAdmin: boolean = (() => {
    // 1) /auth/status yanıtı
    if (statusData?.is_admin) return true;
    if (statusData?.user?.role === "admin") return true;

    // 2) useAuth içindeki user.role / user.roles
    const role = user?.role;
    if (role === "admin") return true;
    if (typeof role === "string" && role.toLowerCase() === "admin") return true;

    if (Array.isArray(user?.roles)) {
      if (user.roles.some((r) => String(r).toLowerCase() === "admin")) {
        return true;
      }
    }

    return false;
  })();

  // ---------- Guard: login + admin kontrolü ----------
  useEffect(() => {
    // Hâlâ yükleniyorsa bekle
    if (authLoading || statusLoading) return;

    // Login değilse → giriş sayfası
    if (!user) {
      navigate("/giris", { replace: true });
      return;
    }

    // Login ama admin değilse → ana sayfa
    if (!isAdmin) {
      navigate("/", { replace: true });
    }
  }, [authLoading, statusLoading, user, isAdmin, navigate]);

  // Global loading
  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  // Guard: kullanıcı yoksa veya admin değilse (navigate effect zaten çalışıyor)
  if (!user || !isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        {/* Admin sidebar: aktif tab route üzerinden belirleniyor */}
        <AdminSidebar activeTab={getActiveTab()} onTabChange={() => { }} />

        <div className="flex-1 flex flex-col">
          <header className="h-16 border-b flex items-center justify-between px-6 bg-background sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-2xl font-bold">{title}</h1>
            </div>
            <ModeToggle />
          </header>

          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
