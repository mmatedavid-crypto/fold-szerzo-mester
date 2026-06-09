export const COOKIE_CONSENT_STORAGE_KEY = "drfold_cookie_consent_v1";
export const LEGACY_COOKIE_CONSENT_STORAGE_KEY = "fbsz_cookie_consent_v1";

export type CookieConsent = {
  necessary: true;
  analytics: boolean;
  decided_at: string;
};

export function getStoredConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw =
      window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_COOKIE_CONSENT_STORAGE_KEY);
    if (!raw) return null;
    const consent = JSON.parse(raw) as CookieConsent;
    if (!window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)) {
      window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, raw);
      window.localStorage.removeItem(LEGACY_COOKIE_CONSENT_STORAGE_KEY);
    }
    return consent;
  } catch {
    return null;
  }
}

export function saveConsent(consent: CookieConsent) {
  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent));
  window.localStorage.removeItem(LEGACY_COOKIE_CONSENT_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent("drfold:cookie-consent", { detail: consent }));
}
