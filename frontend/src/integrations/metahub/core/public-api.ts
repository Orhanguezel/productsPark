// src/integrations/metahub/core/public-api.ts
import type { Session, User } from "./types";
export type { Session, User } from "./types";
import type { FromPromise } from "../db/from";
import type { ChannelStatus } from "../realtime/channel";

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

  /** Aktif oturumu döner (cookie ya da mevcut store’a göre). */
  getSession(): Promise<{ data: { session: Session | null } }>;

  /** Store değişimini dinlemek için. */
  onAuthStateChange(
    cb: (event: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED", session: Session | null) => void
  ): { data: { subscription: { unsubscribe(): void } } };

  /** Çıkış yap. */
  signOut(): Promise<void>;

  // ---- UI’de kullanılan ekler ----
  /** Kullanıcı bilgisini döner (gerekirse getSession üzerinden). */
  getUser(): Promise<{ data: { user: User | null } }>;

  /** Basit durum: { authenticated, is_admin } */
  getStatus(): Promise<{ data: { authenticated: boolean; is_admin: boolean } }>;

  // ---- Supabase uyumlu ilaveler ----
  resetPasswordForEmail(
    email: string,
    opts?: { redirectTo?: string }
  ): Promise<{ error: { message: string } | null }>;

  updateUser(
    body: Partial<User> & { password?: string }
  ): Promise<{ data?: { user: User | null }; error: { message: string } | null }>;
};

export type FunctionsFacade = {
  invoke<T = unknown>(
    name: string,
    args?: { body?: unknown }   // <- opsiyonel
  ): Promise<{ data: T | null; error: { message: string; status?: number } | null }>;
};


export type Metahub = {
  auth: AuthFacade;
  functions: FunctionsFacade;
  api: typeof import("../rtk");
  baseApi: typeof import("../rtk/baseApi").baseApi;
  from: <T = unknown>(table: string) => FromPromise<T>;
  channel: (
    name: string
  ) => {
    on(event: string, cb: (payload: unknown) => void): unknown;
    subscribe(
      cb?: (s: ChannelStatus) => void
    ): Promise<{ data: { subscription: { unsubscribe(): void } }; error: null }>;
  };
  removeChannel: (ch: unknown) => void;
  removeAllChannels: () => void;
};
