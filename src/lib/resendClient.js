import { env } from '../config/env';
import { getSupabaseClient } from './supabaseClient';

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

export async function sendEmailWithResend({
  to,
  subject,
  html,
  text,
  from = resolveFromAddress(),
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
}) {
  const { client, error: clientError } = getSupabaseClient();
  if (!client) {
    return {
      data: null,
      error: clientError || 'Supabase is not configured.',
    };
  }

  try {
    const { data, error: invokeError } = await client.functions.invoke('send-email', {
      body: {
        to: normalizeRecipients(to),
        subject,
        html,
        text,
        from,
      },
    });

    if (invokeError) {
      console.error('Supabase send-email function invocation error details:', invokeError);
      const message = invokeError.message || 'Failed to invoke email function.';
      const hint = message.includes('Requested function was not found')
        ? ' Deploy the send-email Supabase function and set RESEND_API_KEY as a secret.'
        : '';
      return { data: null, error: message + hint };
    }

    if (data?.error) {
      console.error('Supabase send-email function returned error:', data.error);
      return { data: null, error: data.error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Supabase send-email function invocation exception:', error);
    return {
      data: null,
      error: getErrorMessage(error, 'Unable to send email — network error.'),
    };
  }
}

export async function sendEmailViaApi({ to, subject, html, text, signal }) {
  if (!env.emailApiUrl) {
    return {
      data: null,
      error: 'Email API URL is missing.',
    };
  }

  try {
    const response = await fetch(env.emailApiUrl, {
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, html, text }),
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

/**
 * Unified send function.
 *
 * Priority:
 *  1. VITE_EMAIL_API_URL — custom backend proxy (e.g. /api/send-email in dev)
 *  2. Supabase `send-email` edge function — recommended for production
 *  3. Direct Resend from browser — local dev fallback only
 */
export async function sendEmail(payload) {
  if (env.emailApiUrl) {
    return sendEmailViaApi(payload);
  }

  const { client } = getSupabaseClient();
  if (client) {
    return sendEmailViaSupabaseFunction(payload);
  }

  if (import.meta.env.DEV && env.resendApiKey) {
    return sendEmailWithResend(payload);
  }

  return {
    data: null,
    error:
      'Email is not configured. Deploy the Supabase send-email function and set RESEND_API_KEY as a secret.',
  };
}
