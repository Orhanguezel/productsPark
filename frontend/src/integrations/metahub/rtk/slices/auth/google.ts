// src/integrations/metahub/rtk/slices/auth/google.ts
import type { ResultError } from "@/integrations/metahub/core/types";

/* ---- Google GSI minimal typings ---- */
interface GsiCredentialResponse { credential?: string }
interface IdConfiguration {
  client_id: string;
  callback: (response: GsiCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
}
interface PromptMomentNotification { isNotDisplayed(): boolean; isSkippedMoment(): boolean; }
interface GoogleGSI {
  accounts: { id: { initialize(c: IdConfiguration): void; prompt(cb?: (n: PromptMomentNotification) => void): void; } };
}
declare global { interface Window { google?: GoogleGSI } }

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("script_load_failed"));
    document.head.appendChild(s);
  });
}

export async function getGoogleIdToken(googleClientId: string): Promise<{ idToken: string | null; error: ResultError | null }> {
  if (!googleClientId) return { idToken: null, error: { message: "missing_google_client_id" } };

  try {
    await loadScriptOnce("https://accounts.google.com/gsi/client");
    const g = window.google;
    if (!g || !g.accounts?.id) return { idToken: null, error: { message: "google_sdk_unavailable" } };

    return await new Promise((resolve) => {
      let settled = false;
      g.accounts.id.initialize({
        client_id: googleClientId,
        callback: (resp: GsiCredentialResponse) => {
          if (settled) return;
          settled = true;
          const idToken = resp?.credential || null;
          if (!idToken) return resolve({ idToken: null, error: { message: "google_no_credential" } });
          resolve({ idToken, error: null });
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      g.accounts.id.prompt((n?: PromptMomentNotification) => {
        if (!n) return;
        const closed = n.isNotDisplayed() || n.isSkippedMoment();
        if (closed && !settled) {
          settled = true;
          resolve({ idToken: null, error: { message: "google_popup_closed" } });
        }
      });
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "google_init_failed";
    return { idToken: null, error: { message } };
  }
}
