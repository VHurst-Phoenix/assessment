import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupabaseEdgeFunctionUrl } from './resendClient.js';

test('buildSupabaseEdgeFunctionUrl appends the edge function path to the Supabase base URL', () => {
  assert.equal(
    buildSupabaseEdgeFunctionUrl('https://abc123.supabase.co', 'send-email'),
    'https://abc123.supabase.co/functions/v1/send-email'
  );
});

test('buildSupabaseEdgeFunctionUrl preserves a trailing slash on the Supabase base URL', () => {
  assert.equal(
    buildSupabaseEdgeFunctionUrl('https://abc123.supabase.co/', 'send-email'),
    'https://abc123.supabase.co/functions/v1/send-email'
  );
});
