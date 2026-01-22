// =============================================================
// FILE: src/pages/account/Dashboard.tsx  (FINAL)
// - Wallet balance: never hide errors with "= 0" destructure default
// - walletBalance is always number (safe coercion; supports many response shapes)
// - totalSpent computed from completed-like orders (no any)
// =============================================================

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';

import {
  useListOrdersByUserQuery,
  useListMyWalletTransactionsQuery,
  useGetMyWalletBalanceQuery,
} from '@/integrations/hooks';

import type { WalletTransaction as WalletTxn, OrderView as Order } from '@/integrations/types';

import { StatsCards } from './components/StatsCards';
import { OrdersTab } from './components/OrdersTab';
import { WalletTab } from './components/Wallet/WalletTab';
import { ProfileTab } from './components/ProfileTab';
import { SupportTab } from './components/Support/SupportTab';
import { NotificationsTab } from './components/NotificationsTab';

/* ---------------- helpers (strict) ---------------- */
const toNum = (v: unknown, d = 0): number => {
  // direct number
  if (typeof v === 'number' && Number.isFinite(v)) return v;

  // string numbers (comma tolerant)
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s) return d;
    const n = Number(s.replace(',', '.'));
    return Number.isFinite(n) ? n : d;
  }

  // object shapes (supports many backend wrappers)
  if (v && typeof v === 'object') {
    const rec = v as Record<string, unknown>;

    const directKeys = ['balance', 'wallet_balance', 'walletBalance', 'value', 'amount'] as const;
    for (const k of directKeys) {
      if (rec[k] != null) return toNum(rec[k], d);
    }

    const nestedKeys = ['data', 'result', 'item', 'payload'] as const;
    for (const nk of nestedKeys) {
      const inner = rec[nk];
      if (inner && typeof inner === 'object') {
        const irec = inner as Record<string, unknown>;
        for (const k of directKeys) {
          if (irec[k] != null) return toNum(irec[k], d);
        }
      }
    }
  }

  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : d;
};

const isCompletedLike = (status: unknown): boolean => {
  const s = String(status ?? '')
    .trim()
    .toLowerCase();
  return ['completed', 'complete', 'delivered', 'paid', 'success'].includes(s);
};

const pickOrderTotal = (o: Record<string, unknown>): number => {
  const candidates: unknown[] = [
    o.final_amount,
    o.finalAmount,
    o.total,
    o.total_amount,
    o.totalAmount,
    o.grand_total,
    o.grandTotal,
    o.payable_total,
    o.payableTotal,
  ];

  for (const v of candidates) {
    const n = toNum(v, NaN);
    if (Number.isFinite(n)) return n;
  }
  return 0;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { unreadCount } = useNotifications();

  // ---------- Guard: prevent infinite navigate loops ----------
  const navGuard = useRef(false);
  useEffect(() => {
    if (!authLoading && !user && !navGuard.current) {
      navGuard.current = true;
      navigate('/giris', { replace: true });
    }
  }, [authLoading, user, navigate]);

  // ---------- Aktif tab ----------
  const [tabValue, setTabValue] = useState<
    'orders' | 'wallet' | 'profile' | 'support' | 'notifications'
  >('orders');

  useEffect(() => {
    if (unreadCount > 0) setTabValue('notifications');
  }, [unreadCount]);

  // ---------- Orders ----------
  const ordersSkip = !user?.id;
  const {
    data: orders = [],
    isLoading: ordersLoading,
    isError: ordersError,
    error: ordersErrObj,
  } = useListOrdersByUserQuery(user?.id ?? '', { skip: ordersSkip });

  // ---------- Wallet: Transactions ----------
  const walletArgs = useMemo(() => ({ order: 'desc' as const }), []);
  const walletOpts = useMemo(
    () => ({
      skip: !user?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }),
    [user?.id],
  );

  const {
    data: walletTxns = [],
    isLoading: txLoading,
    isError: txError,
    error: txErrObj,
  } = useListMyWalletTransactionsQuery(walletArgs, walletOpts);

  // ---------- Wallet: Balance ----------
  const balanceOpts = useMemo(
    () => ({
      skip: !user?.id,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
      refetchOnReconnect: true,
      pollingInterval: 15000,
    }),
    [user?.id],
  );

  // ❗️ÖNEMLİ: "= 0" ile hatayı gizlemiyoruz
  const {
    data: myBalanceRaw,
    isLoading: balanceLoading,
    isError: balanceError,
    error: balanceErrObj,
  } = useGetMyWalletBalanceQuery(undefined, balanceOpts);

  const myBalance = useMemo(() => toNum(myBalanceRaw, 0), [myBalanceRaw]);

  useEffect(() => {
    if (ordersError) console.error('orders error:', ordersErrObj);
  }, [ordersError, ordersErrObj]);

  useEffect(() => {
    if (txError) console.error('wallet tx error:', txErrObj);
  }, [txError, txErrObj]);

  useEffect(() => {
    if (balanceError) console.error('wallet balance error:', balanceErrObj);
  }, [balanceError, balanceErrObj]);

  // ---------- Derived ----------
  const totalSpent = useMemo(() => {
    return (orders as Order[])
      .filter((o) => isCompletedLike((o as unknown as { status?: unknown }).status))
      .reduce((sum, o) => sum + pickOrderTotal(o as unknown as Record<string, unknown>), 0);
  }, [orders]);

  const loading = authLoading || ordersLoading || txLoading || balanceLoading;

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-8">Hesabım</h1>

          <StatsCards
            ordersCount={(orders as Order[]).length}
            walletBalance={myBalance}
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
                  setTabValue(v as 'orders' | 'wallet' | 'profile' | 'support' | 'notifications')
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
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="orders" className="space-y-4 mt-6">
                  <OrdersTab orders={orders as Order[]} />
                </TabsContent>

                <TabsContent value="wallet" className="space-y-4 mt-6">
                  <WalletTab txns={walletTxns as WalletTxn[]} txLoading={txLoading} />
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

          {balanceError && (
            <div className="mt-4 text-xs text-muted-foreground">
              Cüzdan bakiyesi alınamadı. Konsolu kontrol edin.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;
