/**
 * Integration test for the same path the React app uses after assessment completion.
 * Requires `npm run dev` to be running when VITE_EMAIL_API_URL=/api/send-email.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env');

function loadEnv() {
  const vars = {};
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    vars[key] = val;
  }
  return vars;
}

const env = loadEnv();
const emailApiUrl = env.VITE_EMAIL_API_URL || '';
const baseUrl = process.argv[2] || 'http://localhost:5173';
const recipient = process.argv[3] || 'adeolaademilua57@gmail.com';

const assessmentPayload = {
  firstName: 'Adeola',
  lastName: 'Test',
  email: recipient,
  score: 74,
  archetype: 'phoenix_momentum',
  dimScores: [19, 17, 16, 18, 15],
};

async function main() {
  console.log('\nPhoenix Email Integration Test');
  console.log('──────────────────────────────');
  console.log('  API URL  :', emailApiUrl || '(not set — will use Supabase function)');
  console.log('  Base URL :', baseUrl);
  console.log('  To       :', recipient);

  const target = emailApiUrl.startsWith('http')
    ? emailApiUrl
    : `${baseUrl}${emailApiUrl || '/api/send-email'}`;

  const html = `<p>Dear ${assessmentPayload.firstName},</p><p>Your score: ${assessmentPayload.score}/100</p>`;
  const text = `Dear ${assessmentPayload.firstName}, your score is ${assessmentPayload.score}/100`;

  console.log('\nSending via', target, '...\n');

  const response = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: assessmentPayload.email,
      subject: 'Your Personal Phoenix Clarity Assessment Report',
      html,
      text,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('FAILED:', response.status, payload?.error || payload);
    process.exit(1);
  }

  console.log('SUCCESS — email dispatched');
  console.log('  Message ID:', payload?.id || payload?.messageId || '(see response)');
  console.log('  Response  :', JSON.stringify(payload));
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
