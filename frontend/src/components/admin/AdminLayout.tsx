import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { metahub } from "@/integrations/metahub/client";
import { useAuth } from "@/hooks/useAuth";
import { AdminSidebar } from "./AdminSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/ModeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Determine active tab based on current path
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/reports")) return "reports";
    if (path.includes("/home-settings")) return "home-settings";
    if (path.includes("/products")) return "products";
    if (path.includes("/orders")) return "orders";
    if (path.includes("/categories")) return "categories";
    if (path.includes("/blog")) return "blog";
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

  useEffect(() => {
    if (!authLoading && user) {
      checkAdminStatus();
    } else if (!authLoading && !user) {
      navigate("/giris");
    }
  }, [user, authLoading, navigate]);

  const checkAdminStatus = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await metahub
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("Error checking admin status:", error);
        navigate("/");
        return;
      }

      if (!data) {
        navigate("/");
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
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
