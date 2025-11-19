// =============================================================
// FILE: src/pages/account/Dashboard.tsx  (WRAPPER - FIXED)
// =============================================================
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";

// RTK
import { useListOrdersByUserQuery } from "@/integrations/metahub/rtk/endpoints/orders.endpoints";
import {
  useListMyWalletTransactionsQuery,
  useGetMyWalletBalanceQuery,
} from "@/integrations/metahub/rtk/endpoints/wallet.endpoints";
import type { WalletTransaction as WalletTxn } from "@/integrations/metahub/db/types/wallet";
import type { OrderView as Order } from "@/integrations/metahub/db/types/orders";

// Local tabs
import { StatsCards } from "./components/StatsCards";
import { OrdersTab } from "./components/OrdersTab";
import { WalletTab } from "./components/Wallet/WalletTab";
import { ProfileTab } from "./components/ProfileTab";
import { SupportTab } from "./components/Support/SupportTab";
import { NotificationsTab } from "./components/NotificationsTab";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  // Bildirim sayısı (sadece count; listeyi tab içinde çekeceğiz)
  const { unreadCount } = useNotifications();

  // ---------- Guard: prevent infinite navigate loops ----------
  const navGuard = useRef(false);
  useEffect(() => {
    if (!authLoading && !user && !navGuard.current) {
      navGuard.current = true;
      navigate("/giris", { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ---------- Aktif tab kontrolü ----------
  const [tabValue, setTabValue] = useState<
    "orders" | "wallet" | "profile" | "support" | "notifications"
  >("orders");

  // Eğer unread varsa ilk açılışta Bildirimler’e geç
  useEffect(() => {
    if (unreadCount > 0) {
      setTabValue("notifications");
    }
  }, [unreadCount]);

  // ---------- Orders ----------
  const ordersSkip = !user?.id;
  const { data: orders = [], isLoading: ordersLoading } =
    useListOrdersByUserQuery(user?.id ?? "", { skip: ordersSkip });

  // ---------- Wallet: Transactions (me) ----------
  const walletArgs = useMemo(() => ({ order: "desc" as const }), []);
  const walletOpts = useMemo(
    () => ({
      skip: !user?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }),
    [user?.id]
  );
  const { data: walletTxns = [], isLoading: txLoading } =
    useListMyWalletTransactionsQuery(walletArgs, walletOpts);

  // ---------- Wallet: Balance (me) ----------
  const balanceOpts = useMemo(
    () => ({
      skip: !user?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }),
    [user?.id]
  );

  // Authoritative balance from backend (reflects admin approvals & harcamalar)
  const { data: myBalance = 0, isLoading: balanceLoading } =
    useGetMyWalletBalanceQuery(undefined, balanceOpts);

  // ---------- Derived ----------
  const totalSpent = useMemo(
    () =>
      orders
        .filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + Number((o as any).final_amount ?? 0), 0),
    [orders]
  );

  const loading = authLoading || ordersLoading || txLoading || balanceLoading;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Yükleniyor...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Hesabım</h1>

          {/* Üst kartlar: toplam sipariş / mevcut bakiye / toplam harcama */}
          <StatsCards
            ordersCount={orders.length}
            walletBalance={myBalance ?? 0}
            totalSpent={totalSpent}
            txLoading={txLoading}
          />

          <Card>
            <CardHeader>
              <CardTitle>Hesap Yönetimi</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs
                value={tabValue}
                onValueChange={(v) =>
                  setTabValue(
                    v as
                      | "orders"
                      | "wallet"
                      | "profile"
                      | "support"
                      | "notifications"
                  )
                }
              >
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="orders">Siparişlerim</TabsTrigger>
                  <TabsTrigger value="wallet">Cüzdan</TabsTrigger>
                  <TabsTrigger value="profile">Profil</TabsTrigger>
                  <TabsTrigger value="support">Destek</TabsTrigger>
                  <TabsTrigger value="notifications">
                    Bildirimler
                    {unreadCount > 0 && (
                      <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive text-[10px] font-semibold text-destructive-foreground px-1">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4 mt-6">
                  <OrdersTab orders={orders as Order[]} />
                </TabsContent>

                <TabsContent value="wallet" className="space-y-4 mt-6">
                  {/* Wallet işlemleri: RTK’dan gelen gerçek txn listesi */}
                  <WalletTab
                    txns={walletTxns as WalletTxn[]}
                    txLoading={txLoading}
                  />
                </TabsContent>

                <TabsContent value="profile" className="space-y-4 mt-6">
                  <ProfileTab />
                </TabsContent>

                <TabsContent value="support" className="space-y-4 mt-6">
                  <SupportTab />
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4 mt-6">
                  <NotificationsTab />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
