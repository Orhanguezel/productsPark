// src/integrations/metahub/client/auth.ts
import { tokenStore } from "@/integrations/metahub/core/token";
import { store } from "@/store";
import {
  authApi,
  type TokenResp,
  type UserResp,
  type StatusResp,
} from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import type { AuthFacade } from "@/integrations/metahub/core/public-api";
import type { Session, User } from "@/integrations/metahub/core/types";
import { normalizeError } from "@/integrations/metahub/core/errors";

/* In-memory session + listeners */
let currentSession: Session | null = null;
const listeners = new Set<
  (ev: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED", s: Session | null) => void
>();
const emit = (ev: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED") => {
  listeners.forEach((cb) => cb(ev, currentSession));
};

function buildSessionFromTokenResp(resp: TokenResp): Session {
  return {
    accessToken: resp.access_token ?? "",
    refreshToken: resp.refresh_token,
    expiresIn: resp.expires_in ?? 900,
    tokenType: resp.token_type ?? "bearer",
    user: resp.user,
  };
}

export const auth: AuthFacade = {
  async signInWithPassword({ email, password }) {
    try {
      const tokenResp = (await store
        .dispatch(authApi.endpoints.token.initiate({ email, password }))
        .unwrap()) as TokenResp;

      const session = buildSessionFromTokenResp(tokenResp);
      tokenStore.set(session.accessToken);
      currentSession = session;
      emit("SIGNED_IN");
      return { data: { session }, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { data: { session: null }, error: { message: message || "login_failed" } };
    }
  },

  async signUp({ email, password, options }) {
    try {
      // BE signup TokenResp döndürüyor → doğrudan oturum kur.
      const resp = (await store
        .dispatch(authApi.endpoints.signUp.initiate({ email, password, options }))
        .unwrap()) as TokenResp;

      const session = buildSessionFromTokenResp(resp);
      tokenStore.set(session.accessToken);
      currentSession = session;
      emit("SIGNED_IN");

      return { data: { user: session.user }, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { data: { user: null }, error: { message: message || "signup_failed" } };
    }
  },

  async signInWithOAuth({ provider, options }) {
    if (provider !== "google") return { error: { message: "unsupported_oauth_provider" } };

    if (options?.idToken) {
      try {
        const resp = (await store
          .dispatch(authApi.endpoints.signInWithGoogle.initiate({ idToken: options.idToken }))
          .unwrap()) as TokenResp;

        const session = buildSessionFromTokenResp(resp);
        tokenStore.set(session.accessToken);
        currentSession = session;
        emit("SIGNED_IN");
        return { error: null };
      } catch (e: unknown) {
        const { message } = normalizeError(e);
        return { error: { message: message || "oauth_failed" } };
      }
    }

    if (options?.redirectTo) {
      try {
        const { url } = (await store
          .dispatch(authApi.endpoints.googleStart.initiate({ redirectTo: options.redirectTo }))
          .unwrap()) as { url: string };
        window.location.href = url;
        return { error: null };
      } catch (e: unknown) {
        const { message } = normalizeError(e);
        return { error: { message: message || "oauth_start_failed" } };
      }
    }

    return { error: { message: "id_token_or_redirect_required" } };
  },

  async getSession() {
    if (currentSession?.user) return { data: { session: currentSession } };

    const token = tokenStore.get();
    if (!token) return { data: { session: null } };

    try {
      const me = (await store.dispatch(authApi.endpoints.me.initiate()).unwrap()) as UserResp;
      currentSession = {
        accessToken: token,
        refreshToken: undefined,
        expiresIn: 900,
        tokenType: "bearer",
        user: me.user,
      };
      emit("TOKEN_REFRESHED");
      return { data: { session: currentSession } };
    } catch {
      tokenStore.set(null);
      currentSession = null;
      emit("SIGNED_OUT");
      return { data: { session: null } };
    }
  },

  onAuthStateChange(cb) {
    listeners.add(cb);
    cb(currentSession ? "SIGNED_IN" : "SIGNED_OUT", currentSession);
    return { data: { subscription: { unsubscribe() { listeners.delete(cb); } } } };
  },

  async signOut() {
    try { await store.dispatch(authApi.endpoints.logout.initiate()).unwrap(); } catch { /* ignore */ }
    tokenStore.set(null);
    currentSession = null;
    emit("SIGNED_OUT");
  },

  async getUser() {
    if (currentSession?.user) return { data: { user: currentSession.user } };
    const { data } = await this.getSession();
    return { data: { user: data.session?.user ?? null } };
  },

  async getStatus() {
    try {
      const s = (await store.dispatch(authApi.endpoints.status.initiate()).unwrap()) as StatusResp;
      return { data: { authenticated: s.authenticated, is_admin: s.is_admin } };
    } catch {
      const { data } = await this.getSession();
      return { data: { authenticated: !!data.session?.user, is_admin: false } };
    }
  },

  async resetPasswordForEmail(_email: string, _opts?: { redirectTo?: string }) {
    return { error: { message: "password_reset_not_supported" } };
  },

  async updateUser(body: Partial<User> & { password?: string }) {
    try {
      const updated = (await store
        .dispatch(authApi.endpoints.updateUser.initiate(body))
        .unwrap()) as UserResp;

      if (currentSession) {
        currentSession = { ...currentSession, user: updated.user };
        emit("TOKEN_REFRESHED");
      }
      return { data: { user: updated.user }, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { error: { message: message || "update_user_failed" } };
    }
  },
};
