const TOKEN_KEY = "access_token";

export const tokenStore = {
  get(): string {
    return localStorage.getItem(TOKEN_KEY) || "";
  },
  set(token?: string | null) {
    if (!token) localStorage.removeItem(TOKEN_KEY);
    else localStorage.setItem(TOKEN_KEY, token);
  },
};
