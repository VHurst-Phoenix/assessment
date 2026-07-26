import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSupabaseEdgeFunctionUrl, shouldUseEmailApiProxy } from './resendClient.js';

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

test('shouldUseEmailApiProxy skips same-origin proxy routes in production', () => {
  assert.equal(shouldUseEmailApiProxy('/api/send-email', false), false);
});

test('shouldUseEmailApiProxy uses absolute URLs in production', () => {
  assert.equal(shouldUseEmailApiProxy('https://example.com/api/send-email', false), true);
});

test('shouldUseEmailApiProxy allows the proxy in development', () => {
  assert.equal(shouldUseEmailApiProxy('/api/send-email', true), true);
});
