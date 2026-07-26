import { env } from '../config/env.js';

const RESEND_EMAILS_URL = 'https://api.resend.com/emails';

/**
 * Determines the safest available "from" address.
 *
 * Priority:
 *  1. VITE_RESEND_FROM_EMAIL if set (requires domain to be verified on resend.com/domains)
 *  2. onboarding@resend.dev  — Resend's pre-verified sandbox sender.
 *     Works without domain verification but can ONLY deliver to the
 *     Resend account owner's email. Suitable for testing / early production.
 *
 * Once phoenixclearinsight.com is verified in Resend, VITE_RESEND_FROM_EMAIL
 * will be used automatically and emails can go to any recipient.
 */
function resolveFromAddress() {
  return env.resendFromEmail || 'onboarding@resend.dev';
}

function normalizeRecipients(to) {
  return Array.isArray(to) ? to : [to];
}

function getErrorMessage(error, fallback) {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  return error.message || fallback;
}

async function parseJson(response) {
  return response.json().catch(() => null);
}

function getIsDev() {
  return typeof import.meta !== 'undefined' && import.meta.env ? Boolean(import.meta.env.DEV) : false;
}

export function buildSupabaseEdgeFunctionUrl(supabaseUrl, functionName = 'send-email') {
  if (!supabaseUrl) return null;
  const trimmedUrl = supabaseUrl.trim();
  if (/\/functions\/v1\/[^/]+\/?$/.test(trimmedUrl)) {
    return trimmedUrl.replace(/\/+$/, '');
  }
  const normalizedBaseUrl = trimmedUrl.replace(/\/+$/, '');
  return `${normalizedBaseUrl}/functions/v1/${functionName}`;
}

export async function sendEmailWithResend({
  to,
  subject,
  html,
  text,
  from = resolveFromAddress(),
  replyTo,
  bcc,
  cc,
  signal,
}) {
  if (!env.resendApiKey) {
    return {
      data: null,
      error: 'Resend API key is missing. Set VITE_RESEND_API_KEY in your environment.',
    };
  }

  try {
    const response = await fetch(RESEND_EMAILS_URL, {
      method: 'POST',
      signal,
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: normalizeRecipients(to),
        subject,
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        ...(bcc ? { bcc: normalizeRecipients(bcc) } : {}),
        ...(cc ? { cc: normalizeRecipients(cc) } : {}),
      }),
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      // Provide a helpful hint for the most common production error
      const rawMsg =
        payload?.message || payload?.error || `Resend request failed with status ${response.status}.`;
      const hint =
        response.status === 403 && rawMsg.includes('domain is not verified')
          ? ' → Go to https://resend.com/domains to verify phoenixclearinsight.com.'
          : '';

      return { data: null, error: rawMsg + hint };
    }

    return { data: payload, error: null };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error, 'Unable to send email — network error.'),
    };
  }
}

/**
 * Sends email through the Supabase `send-email` edge function.
 * Keeps the Resend API key server-side and avoids browser CORS blocks.
 */
export async function sendEmailViaSupabaseFunction({
  to,
  subject,
  html,
  text,
  from = resolveFromAddress(),
  replyTo,
  bcc,
  cc,
}) {
  const functionUrl = buildSupabaseEdgeFunctionUrl(env.emailFunctionUrl || env.supabaseUrl, 'send-email');
  if (!functionUrl) {
    return {
      data: null,
      error: 'Supabase URL is not configured.',
    };
  }

  const headers = {
    'Content-Type': 'application/json',
  };

  if (env.supabaseAnonKey) {
    headers.apikey = env.supabaseAnonKey;
    headers.Authorization = `Bearer ${env.supabaseAnonKey}`;
  }

  try {
    const response = await fetch(functionUrl, {
      method: 'POST',
      mode: 'cors',
      headers,
      body: JSON.stringify({
        to: normalizeRecipients(to),
        subject,
        html,
        text,
        from,
        ...(replyTo ? { replyTo } : {}),
        ...(bcc ? { bcc: normalizeRecipients(bcc) } : {}),
        ...(cc ? { cc: normalizeRecipients(cc) } : {}),
      }),
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      const rawMsg =
        payload?.error ||
        payload?.message ||
        (response.status === 404
          ? 'The email function endpoint was not found. Deploy the send-email function and verify the configured URL.'
          : `Supabase function request failed with status ${response.status}.`);
      const hint = rawMsg.includes('not found') || response.status === 404
        ? ' Deploy the send-email Supabase function and set RESEND_API_KEY as a secret.'
        : rawMsg.includes('JWT') || rawMsg.includes('Unauthorized') || rawMsg.includes('Forbidden')
        ? ' Check Supabase function auth settings: the send-email function must allow unauthenticated calls or the browser must be authenticated.'
        : '';
      return { data: null, error: rawMsg + hint };
    }

    if (payload?.error) {
      console.error('Supabase send-email function returned error:', payload.error);
      return { data: null, error: payload.error };
    }

    return { data: payload, error: null };
  } catch (error) {
    console.error('Supabase send-email function invocation exception:', error);
    const message = getErrorMessage(error, 'Unable to send email — network error.');
    const functionUrl = buildSupabaseEdgeFunctionUrl(env.emailFunctionUrl || env.supabaseUrl, 'send-email');
    const hint = message === 'Failed to fetch'
      ? ` The browser could not reach the configured edge-function URL (${functionUrl || 'not configured'}). Verify VITE_EMAIL_FUNCTION_URL or VITE_SUPABASE_URL and ensure the function is deployed.`
      : '';
    return {
      data: null,
      error: message + hint,
    };
  }
}

function isAbsoluteUrl(url) {
  return typeof url === 'string' && /^(https?:)?\/\//.test(url);
}

function isRelativeUrl(url) {
  return typeof url === 'string' && url.startsWith('/');
}

export async function sendEmailViaApi({ to, subject, html, text, from, replyTo, bcc, cc, signal }) {
  if (!env.emailApiUrl) {
    return {
      data: null,
      error: 'Email API URL is missing.',
    };
  }

  if (!isAbsoluteUrl(env.emailApiUrl) && !isRelativeUrl(env.emailApiUrl)) {
    return {
      data: null,
      error:
        'Email API URL must be an absolute HTTPS URL or a same-origin relative path. Set VITE_EMAIL_API_URL accordingly.',
    };
  }

  try {
    const response = await fetch(env.emailApiUrl, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to,
        subject,
        html,
        text,
        from,
        replyTo,
        bcc,
        cc,
      }),
    });

    const payload = await parseJson(response);

    if (!response.ok) {
      return {
        data: null,
        error:
          payload?.error ||
          payload?.message ||
          `Email request failed with status ${response.status}.`,
      };
    }

    return { data: payload, error: null };
  } catch (error) {
    return {
      data: null,
      error: getErrorMessage(error, 'Unable to send email — network error.'),
    };
  }
}

export function shouldUseEmailApiProxy(emailApiUrl = env.emailApiUrl, isDev = getIsDev()) {
  if (!emailApiUrl) return false;
  if (isDev) return true;
  return isAbsoluteUrl(emailApiUrl);
}

export function shouldAttemptDirectResendFallback(errorMessage, resendApiKey, isDev = getIsDev()) {
  if (!resendApiKey) return false;
  if (isDev) return true;
  if (!errorMessage) return false;
  const normalizedError = String(errorMessage).toLowerCase();
  return /requested function was not found|failed to fetch|network error|status 404|status 500|status 403|not configured/.test(normalizedError);
}

/**
 * Unified send function.
 *
 * Priority:
 *  1. VITE_EMAIL_API_URL — custom backend proxy (dev or absolute URL only)
 *  2. Supabase `send-email` edge function — recommended for production
 *  3. Direct Resend from browser — local dev fallback only
 */
export async function sendEmail(payload) {
  const errors = [];

  if (shouldUseEmailApiProxy()) {
    const apiResult = await sendEmailViaApi(payload);
    if (!apiResult.error) {
      return apiResult;
    }
    errors.push(apiResult.error);
  }

  const supabaseResult = await sendEmailViaSupabaseFunction(payload);
  if (!supabaseResult.error) {
    return supabaseResult;
  }
  errors.push(supabaseResult.error);

  if (shouldAttemptDirectResendFallback(supabaseResult.error, env.resendApiKey)) {
    const resendResult = await sendEmailWithResend(payload);
    if (!resendResult.error) {
      return resendResult;
    }
    errors.push(resendResult.error);
  }

  return {
    data: null,
    error:
      errors.length > 0
        ? errors.join(' | ')
        : 'Email is not configured. Deploy the Supabase send-email function and set RESEND_API_KEY as a secret.',
  };
}
