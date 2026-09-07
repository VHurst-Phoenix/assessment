export const CLARITY_CONSENT_VERSION = '2026-09-05';

const CONSENT_KEY = 'phoenix_clarity_consent_accepted';

/** The session gate ensures the notice is shown before a public assessment begins. */
export function hasConsented() {
  return sessionStorage.getItem(CONSENT_KEY) === 'true';
}

export function recordConsent() {
  sessionStorage.setItem(CONSENT_KEY, 'true');
}
