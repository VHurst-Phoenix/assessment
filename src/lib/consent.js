// Bump this whenever the Clarity notice text changes. The Supabase insert
// policy for assessments must list the same value.
export const CLARITY_CONSENT_VERSION = '2026-10-14';
export const CONSENT_CONTACT_EMAIL = 'veta.hurst@phoenixclearinsight.com';
export const READINESS_CONSENT_VERSION = '1.0';
export const EXECUTION_CONSENT_VERSION = '1.0';

const CONSENT_KEY = 'phoenix_clarity_consent_accepted';
const toolConsentKey = (tool) => `phoenix_${tool}_consent_accepted`;

/** The session gate ensures the notice is shown before a public assessment begins. */
export function hasConsented() {
  return sessionStorage.getItem(CONSENT_KEY) === 'true';
}

export function recordConsent() {
  sessionStorage.setItem(CONSENT_KEY, 'true');
}

export function hasToolConsented(tool) {
  return ['readiness', 'execution'].includes(tool) && sessionStorage.getItem(toolConsentKey(tool)) === 'true';
}

export function recordToolConsent(tool) {
  if (['readiness', 'execution'].includes(tool)) {
    sessionStorage.setItem(toolConsentKey(tool), 'true');
  }
}

export function hasReadinessConsented() {
  return hasToolConsented('readiness');
}

export function hasExecutionConsented() {
  return hasToolConsented('execution');
}
