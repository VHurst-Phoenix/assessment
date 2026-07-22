import { env } from '../config/env';
import { getSupabaseClient } from './supabaseClient';

const CONVERTKIT_BASE_URL = 'https://api.convertkit.com/v3';

function normalizeConvertKitPayload({ email, firstName }) {
  const payload = {
    api_key: env.convertKitApiKey,
    email,
  };

  if (firstName) payload.first_name = firstName;

  return payload;
}

async function subscribeToConvertKitDirect({ email, firstName }) {
  if (!env.convertKitApiKey) {
    return {
      data: null,
      error:
        'ConvertKit is not configured for direct browser fallback. Set VITE_CONVERTKIT_API_KEY or use the Supabase function.',
    };
  }

  const tagId = env.convertKitTagId;
  const formId = env.convertKitFormId;
  const endpoint = tagId
    ? `${CONVERTKIT_BASE_URL}/tags/${tagId}/subscribe`
    : formId
    ? `${CONVERTKIT_BASE_URL}/forms/${formId}/subscribe`
    : null;

  if (!endpoint) {
    return {
      data: null,
      error: 'ConvertKit is not configured with a form ID or tag ID.',
    };
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalizeConvertKitPayload({ email, firstName })),
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      return {
        data: null,
        error:
          payload?.message ||
          payload?.error ||
          `ConvertKit request failed with status ${response.status}.`,
      };
    }

    return { data: payload, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to subscribe via ConvertKit.',
    };
  }
}

export async function subscribeToConvertKit({ email, firstName, archetype }) {
  if (!email) {
    return { data: null, error: 'Email is required for ConvertKit subscription.' };
  }

  const { client } = getSupabaseClient();
  if (client) {
    try {
      const { data, error: invokeError } = await client.functions.invoke('convertkit-subscribe', {
        body: {
          email,
          first_name: firstName || '',
          archetype: archetype || undefined,
          form_id: env.convertKitFormId || undefined,
          tag_id: env.convertKitTagId || undefined,
        },
      });

      if (invokeError) {
        console.error('Supabase convertkit-subscribe function invocation error details:', invokeError);
      }
      if (data?.error) {
        console.error('Supabase convertkit-subscribe function returned error:', data.error);
      }

      if (!invokeError && !data?.error) {
        return { data, error: null };
      }

      const fallback = await subscribeToConvertKitDirect({ email, firstName });
      if (!fallback.error) {
        return fallback;
      }

      return {
        data: null,
        error:
          data?.error ||
          invokeError?.message ||
          fallback.error ||
          'Failed to invoke ConvertKit subscription function.',
      };
    } catch (error) {
      console.error('Supabase convertkit-subscribe function invocation exception:', error);
      const fallback = await subscribeToConvertKitDirect({ email, firstName });
      if (!fallback.error) {
        return fallback;
      }

      return {
        data: null,
        error:
          (error instanceof Error ? error.message : 'Unable to subscribe to ConvertKit via Supabase.') +
          ` Fallback also failed: ${fallback.error}`,
      };
    }
  }

  return subscribeToConvertKitDirect({ email, firstName });
}
