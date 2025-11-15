// =============================================================
// FILE: src/integrations/metahub/core/public-api.ts
// =============================================================

import type { Session, User } from "./types";
export type { Session, User } from "./types";

import type { FromFn } from "../db/from";
import type {
  ChannelStatus,
  SubscriptionResult,
} from "../realtime/channel";

/* ========================= Auth Facade ========================= */

export type BalanceResult = {
  success: boolean;
  balance?: number;
  currency?: string;
  error?: string;
};

export type AuthFacade = {
  signInWithPassword(input: {
    email: string;
    password: string;
  }): Promise<{
    data: { session: Session | null };
    error: { message: string } | null;
  }>;

  signUp(input: {
    email: string;
    password: string;
    options?: { emailRedirectTo?: string; data?: Record<string, unknown> };
  }): Promise<{
    data: { user: User | null };
    error: { message: string } | null;
  }>;

  signInWithOAuth(input: {
    provider: "google";
    options?: { idToken?: string; redirectTo?: string };
  }): Promise<{ error: { message: string } | null }>;

  getSession(): Promise<{ data: { session: Session | null } }>;

  onAuthStateChange(
    cb: (
      event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED",
      session: Session | null
    ) => void
  ): { data: { subscription: { unsubscribe(): void } } };

  signOut(): Promise<void>;

  getUser(): Promise<{ data: { user: User | null } }>;
  getStatus(): Promise<{
    data: { authenticated: boolean; is_admin: boolean };
  }>;

  resetPasswordForEmail(
    email: string,
    opts?: { redirectTo?: string }
  ): Promise<{ error: { message: string } | null }>;

  updateUser(
    body: Partial<User> & { password?: string }
  ): Promise<{
    data?: { user: User | null };
    error: { message: string } | null;
  }>;
};

/* ========================= Functions Facade ========================= */

export type InvokeOkErr<T> = {
  data: T | null;
  error: { message: string; status?: number } | null;
};

export type InvokeResult<T> = Promise<InvokeOkErr<T>>;

export type PaytrTokenResult = {
  success: boolean;
  token?: string;
  error?: string;
};

export type ShopierPaymentFormResult = {
  success: boolean;
  form_action?: string;
  form_data?: Record<string, string>;
  error?: string;
};

// ✅ SMTP test sonucu (export EDİLİYOR)
export type TestSmtpResult = {
  success: boolean;
  message?: string;
  error?: string;
};

export interface FunctionsFacade {
  invoke(
    name: "paytr-get-token",
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<PaytrTokenResult>;

  invoke(
    name: "paytr-havale-get-token" | "paytr_havale_get_token",
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<PaytrTokenResult>;

  invoke(
    name: "shopier-create-payment",
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<ShopierPaymentFormResult>;

  // ✅ SMTP test overload
  invoke(
    name: "test-smtp",
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<TestSmtpResult>;

  invoke(
    name: "turkpin-balance",
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<BalanceResult>;

  invoke(
    name: "turkpin-game-list",
    args?: Readonly<{
      body?: { providerId: string; listType: "epin" | "topup" };
    }>
  ): InvokeResult<{
    success: boolean;
    games?: { id: string; name: string }[];
    error?: string;
  }>;

  invoke(
    name: "turkpin-product-list",
    args?: Readonly<{
      body?: {
        providerId: string;
        gameId: string;
        listType: "epin" | "topup";
      };
    }>
  ): InvokeResult<{
    success: boolean;
    products?: {
      id: string;
      name: string;
      price: number;
      stock: number;
      min_order: number;
      max_order: number;
      tax_type: number;
      pre_order: boolean;
      min_barem?: number;
      max_barem?: number;
      barem_step?: number;
    }[];
    error?: string;
  }>;

  invoke(
    name: "smm-api-balance",
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<BalanceResult>;

  // ✅ Backup fonksiyonu (opsiyonel overload – sadece DX için)
  invoke(
    name: "backup-database",
    args?: Readonly<{ body?: { format: "json" | "sql" } }>
  ): InvokeResult<string>;

  // fallback generic
  invoke<T = unknown>(
    name: string,
    args?: Readonly<{ body?: unknown }>
  ): InvokeResult<T>;
}

/* ========================= Realtime Channel tipi ========================= */

export type ChannelLike = {
  on<T = unknown>(event: string, cb: (payload: T) => void): ChannelLike;
  on<T = unknown>(
    event: string,
    filter: Record<string, unknown>,
    cb: (payload: T) => void
  ): ChannelLike;

  subscribe(
    cb?: (s: ChannelStatus) => void
  ): Promise<SubscriptionResult>;
};

/* ========================= Metahub kök tipi ========================= */

export type Metahub = {
  auth: AuthFacade;
  functions: FunctionsFacade;

  api: typeof import("../rtk");
  baseApi: typeof import("../rtk/baseApi").baseApi;

  // Projedeki from() imzası
  from: FromFn;

  channel: (name: string) => ChannelLike;

  // Runtime'de bizim realtime.removeChannel ile eşleşecek (parametreyi geniş bırakıyoruz)
  removeChannel: (ch: unknown) => void;
  removeAllChannels: () => void;
};
