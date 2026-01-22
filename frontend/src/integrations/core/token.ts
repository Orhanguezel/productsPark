// src/integrations/core/token.ts
const TOKEN_KEY = 'mh_access_token';

function safeGet(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function safeSet(v: string) {
  try {
    localStorage.setItem(TOKEN_KEY, v);
  } catch {
    // ignore
  }
}

function safeRemove() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // ignore
  }
}

export const tokenStore = {
  get(): string | null {
    return safeGet();
  },
  set(token?: string | null) {
    if (!token) safeRemove();
    else safeSet(token);
  },
};
