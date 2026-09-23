export const CLARITY_CONSENT_VERSION = '2026-09-05';
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
