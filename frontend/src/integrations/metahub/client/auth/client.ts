// src/integrations/metahub/auth/client.ts

import { store } from "@/store";
import { setSession, reset } from "@/integrations/metahub/rtk/slices/auth/slice";
import { authApi } from "@/integrations/metahub/rtk/endpoints/auth.endpoints";
import type { AuthFacade } from "@/integrations/metahub/core/public-api";
import type { Session, User } from "@/integrations/metahub/core/types";
import { normalizeError } from "@/integrations/metahub/core/errors";

/** RTK endpoints dönüş tipleri ile uyumlu yardımcı tipler */
type TokenResponse = {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: "bearer";
  user: User;
};

type UserResponse = { user: User };

const listeners = new Set<
  (ev: "SIGNED_IN" | "SIGNED_OUT" | "TOKEN_REFRESHED", s: Session | null) => void
>();

store.subscribe(() => {
  const s = store.getState().auth.session;
  const ev: "SIGNED_IN" | "SIGNED_OUT" = s ? "SIGNED_IN" : "SIGNED_OUT";
  listeners.forEach((cb) => cb(ev, s ?? null));
});

function buildSessionFromTokenResp(resp: TokenResponse): Session {
  return {
    accessToken: resp.access_token ?? null,
    refreshToken: resp.refresh_token,
    expiresIn: resp.expires_in ?? 900,
    tokenType: resp.token_type ?? "bearer",
    user: resp.user ?? null,
  };
}

/** ---- Güvenli yardımcılar (type guard’lar) ---- */
const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isString = (v: unknown): v is string => typeof v === "string";

const isBooleanTrue = (v: unknown): v is true => v === true;

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x): x is string => typeof x === "string");

function readProp<T>(
  obj: unknown,
  key: string,
  guard: (v: unknown) => v is T
): T | undefined {
  if (!isObject(obj)) return undefined;
  const val = obj[key];
  return guard(val) ? val : undefined;
}

export const auth: AuthFacade = {
  async signInWithPassword({ email, password }) {
    try {
      const tokenResp = await store
        .dispatch(authApi.endpoints.token.initiate({ email, password }))
        .unwrap(); // TokenResponse

      const session = buildSessionFromTokenResp(tokenResp as TokenResponse);
      store.dispatch(setSession(session));
      return { data: { session }, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { data: { session: null }, error: { message: message || "login_failed" } };
    }
  },

  async signUp({ email, password, options }) {
    try {
      // backend signup yanıtı: UserResponse (token dönmüyorsa oturum kurmayacağız)
      const resp = (await store
        .dispatch(authApi.endpoints.signUp.initiate({ email, password, options }))
        .unwrap()) as UserResponse;

      return { data: { user: resp.user ?? null }, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { data: { user: null }, error: { message: message || "signup_failed" } };
    }
  },

  async signInWithOAuth({ provider, options }) {
    if (provider !== "google") {
      return { error: { message: "unsupported_oauth_provider" } };
    }

    // 1) ID Token ile direkt giriş
    if (options?.idToken) {
      try {
        const resp = (await store
          .dispatch(authApi.endpoints.signInWithGoogle.initiate({ idToken: options.idToken }))
          .unwrap()) as TokenResponse;

        const session = buildSessionFromTokenResp(resp);
        store.dispatch(setSession(session));
        return { error: null };
      } catch (e: unknown) {
        const { message } = normalizeError(e);
        return { error: { message: message || "oauth_failed" } };
      }
    }

    // 2) Redirect tabanlı akış
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
    const current = store.getState().auth.session;

    // accessToken yoksa yine de /me deneyelim (cookie ile dönebilir)
    if (!current?.accessToken) {
      try {
        const me = (await store.dispatch(authApi.endpoints.me.initiate()).unwrap()) as UserResponse;
        const session: Session = {
          accessToken: current?.accessToken ?? null,
          refreshToken: current?.refreshToken,
          expiresIn: current?.expiresIn ?? 900,
          tokenType: current?.tokenType ?? "bearer",
          user: me.user,
        };
        store.dispatch(setSession(session));
        return { data: { session } };
      } catch {
        store.dispatch(setSession(null));
        return { data: { session: null } };
      }
    }

    try {
      const me = (await store.dispatch(authApi.endpoints.me.initiate()).unwrap()) as UserResponse;
      const s = store.getState().auth.session!;
      const session: Session = { ...s, user: me.user };
      store.dispatch(setSession(session));
      return { data: { session } };
    } catch {
      store.dispatch(setSession(null));
      return { data: { session: null } };
    }
  },

  onAuthStateChange(cb) {
    listeners.add(cb);
    const s = store.getState().auth.session;
    cb(s ? "SIGNED_IN" : "SIGNED_OUT", s ?? null);
    return { data: { subscription: { unsubscribe() { listeners.delete(cb); } } } };
  },

  async signOut() {
    try {
      await store.dispatch(authApi.endpoints.logout.initiate()).unwrap();
    } catch {
      // ignore
    }
    store.dispatch(reset());
  },

  async getUser() {
    // store’daki session’dan oku; yoksa /me ile dene
    const current = store.getState().auth.session;
    if (current?.user) {
      return { data: { user: current.user } };
    }
    const { data } = await auth.getSession();
    return { data: { user: data?.session?.user ?? null } };
  },

  async getStatus() {
    const { data } = await auth.getSession();
    const user = data.session?.user ?? null;

    // role
    const role = readProp<string>(user, "role", isString);

    // roles (kök)
    const rootRoles = readProp<unknown>(user, "roles", (v): v is unknown => v !== undefined);
    const rolesArray: string[] = isStringArray(rootRoles) ? rootRoles : [];

    // app_metadata.roles
    const appMeta = readProp<Record<string, unknown>>(user, "app_metadata", isObject);
    const appMetaRolesUnknown = appMeta ? appMeta["roles"] : undefined;
    const appMetaRoles: string[] = isStringArray(appMetaRolesUnknown) ? appMetaRolesUnknown : [];

    // is_admin alanı
    const isAdminFlag = readProp<true | false>(user, "is_admin", (v): v is true | false => v === true || v === false);

    const isAdmin =
      role === "admin" ||
      rolesArray.includes("admin") ||
      appMetaRoles.includes("admin") ||
      isBooleanTrue(isAdminFlag);

    return { data: { authenticated: !!user, is_admin: isAdmin } };
  },

  // ---------- Supabase-benzeri API uyumu ----------
  async resetPasswordForEmail(email: string, opts?: { redirectTo?: string }) {
    try {
      await store
        .dispatch(authApi.endpoints.resetRequest.initiate({ email, redirectTo: opts?.redirectTo }))
        .unwrap();
      return { error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { error: { message: message || "reset_request_failed" } };
    }
  },

  async updateUser(body: Partial<User> & { password?: string }) {
    try {
      // Eğer URL'de reset token varsa (recovery senaryosu), confirm endpoint’ini kullan
      const url = new URL(window.location.href);
      const type = url.searchParams.get("type");
      const tokenParam = url.searchParams.get("token");
      const hasRecoveryContext = Boolean(type === "recovery" || tokenParam);

      if (body.password && hasRecoveryContext) {
        const resetToken = tokenParam ?? "";
        await store
          .dispatch(authApi.endpoints.resetConfirm.initiate({ token: resetToken, new_password: body.password }))
          .unwrap();

        // Şifre değişti; oturumu sıfırlıyoruz
        store.dispatch(reset());
        return { data: { user: null }, error: null };
      }

      // Normal profil güncelleme
      const updated = (await store
        .dispatch(authApi.endpoints.updateUser.initiate(body))
        .unwrap()) as UserResponse;

      // session.user’ı güncelle
      const s = store.getState().auth.session;
      if (s) {
        store.dispatch(setSession({ ...s, user: updated.user }));
      }

      return { data: { user: updated.user }, error: null };
    } catch (e: unknown) {
      const { message } = normalizeError(e);
      return { error: { message: message || "update_user_failed" } };
    }
  },
};
