/**
 * testEmail.mjs
 * ─────────────
 * Quick smoke-test for the Resend email pipeline.
 *
 * Run with:
 *   node src/api/testEmail.mjs [recipient@email.com]
 *
 * If no recipient is passed, the script prints a dry-run HTML preview
 * to stdout instead of hitting the Resend API.
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

/* ── Load .env manually (no Vite available in raw Node) ── */
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../../.env');

const envVars = {};
try {
  const raw = readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    // Strip surrounding quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    envVars[key] = val;
  }
} catch {
  console.error('⚠️  Could not read .env file — make sure it exists at project root.');
  process.exit(1);
}

const RESEND_API_KEY = envVars.VITE_RESEND_API_KEY;
const FROM_EMAIL = envVars.VITE_RESEND_FROM_EMAIL;
const TO_EMAIL = process.argv[2]; // optional CLI arg

/* ── Mock assessment payload ── */
const mockData = {
  firstName: 'Adeola',
  email: TO_EMAIL || 'test@example.com',
  score: 74,
  archetype: 'phoenix_momentum',
  dimScores: [19, 17, 16, 18, 15], // out of 25 each
};

/* ── HTML builder (inline — mirrors emailService.js) ── */
const archetypes = {
  phoenix_momentum: {
    name: 'Phoenix Momentum',
    directRead:
      "Your scores reveal something most people in your position never get told.\n\nYou have done the hard work of figuring it out. The direction is real. The building is happening. What your scores show is that the gap right now isn't capability or clarity — it's the faith to trust what you're building before the results are fully visible. That is one of the hardest phases of any transformation. Most people stop here because they can't see the proof yet. The Clarity Intensive is where we map exactly what the next chapter requires — and build the conviction to see it through.\n\nBook it.",
  },
  dreaming: {
    name: 'Dreaming',
    directRead:
      "Your scores reveal something most people in your position never get told.\n\nYou are not stuck because you lack clarity — you scored well there. You are stuck because some part of you does not yet believe you are allowed to have what you can see. That is a specific, identifiable pattern. I have seen it in dozens of high-achievers at exactly this stage, and I know what breaks it. It is not more planning. It is not more journaling. It is one direct conversation where someone who can see the pattern names it out loud.\n\nThat conversation is the Clarity Intensive. Book it.",
  },
  awakening: {
    name: 'Awakening',
    directRead:
      "Your scores reveal something most people in your position never get told.\n\nYou are not behind. You are not broken. You are in the middle of one of the most significant transitions a professional can go through — and you are navigating it without a map. The discomfort is not a signal that something is wrong. It is a signal that something real is happening. What you need right now is not a plan. It is a space where someone who has been exactly where you are can help you see what's actually shifting.\n\nThat space is the Clarity Intensive. Book it.",
  },
};

const dimLabels = ['Clarity', 'Confidence', 'Action', 'Alignment', 'Readiness'];
const dimPhases = ['See It', 'Believe It', 'Achieve It', 'Alignment', 'Readiness'];

function buildEmailHTML(data) {
  const score = data.score ?? 0;
  const archetype = archetypes[data.archetype] || archetypes.awakening;
  const dimScores = data.dimScores || [0, 0, 0, 0, 0];

  const dimensionRows = dimScores
    .map((rawScore, idx) => {
      const pct = Math.round((rawScore / 25) * 100);
      const scaledOf20 = Math.round((rawScore / 25) * 20);
      const statusText = pct >= 72 ? 'Active' : pct >= 52 ? 'Developing' : 'Emerging';
      const statusBg = pct >= 72 ? '#EAF4EF' : pct >= 52 ? '#FBF8E8' : '#FAECEE';
      const statusColor = pct >= 72 ? '#2D6A4F' : pct >= 52 ? '#B08A00' : '#8B2635';
      return `<tr>
        <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;">
          <strong style="color:#0D1028;font-size:14px;display:block;">${dimLabels[idx]}</strong>
          <span style="color:#D4A056;font-size:11px;text-transform:uppercase;font-weight:600;">${dimPhases[idx]}</span>
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;text-align:center;">
          <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;">${statusText}</span>
        </td>
        <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;text-align:right;">
          <strong style="color:#0D1028;font-size:16px;">${scaledOf20}/20</strong>
        </td>
      </tr>`;
    })
    .join('');

  return `
<div style="background:#F7F4EF;padding:30px 15px;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:12px;border:1px solid #EDE8DF;margin:0 auto;">
    <tr><td style="background:#0D1028;padding:36px 32px;text-align:center;border-bottom:3px solid #D4A056;">
      <div style="color:#D4A056;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">Phoenix Clear Insight</div>
      <h1 style="color:#fff;font-family:Georgia,serif;font-size:28px;margin:0;">Your Clarity Report</h1>
    </td></tr>
    <tr><td style="padding:32px;">
      <p style="font-size:16px;color:#0D1028;font-weight:600;">Dear ${data.firstName},</p>
      <p style="font-size:14px;color:#6B6B7B;line-height:1.65;">Thank you for completing the Phoenix Clarity Assessment. This report summarises your progress across our 5 clarity dimensions.</p>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#F7F4EF;border-radius:8px;border:1px solid #EDE8DF;margin-bottom:28px;">
        <tr><td style="padding:24px;text-align:center;">
          <div style="font-size:11px;font-weight:800;color:#6B6B7B;text-transform:uppercase;margin-bottom:8px;">YOUR CLARITY SCORE</div>
          <span style="font-size:56px;font-family:Georgia,serif;color:#0D1028;font-weight:700;">${score}</span>
          <span style="font-size:16px;color:#6B6B7B;"> / 100</span><br><br>
          <div style="display:inline-block;background:#0D1028;color:#D4A056;font-size:14px;font-weight:700;padding:8px 24px;border-radius:30px;">${archetype.name}</div>
        </td></tr>
      </table>
      <h3 style="font-family:Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 16px;">The Five Dimensions</h3>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">${dimensionRows}</table>
      <h3 style="font-family:Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 12px;">My Direct Read of Your Scores</h3>
      <div style="font-size:14px;color:#1C1C1C;font-style:italic;border-left:4px solid #D4A056;padding:20px;line-height:1.75;white-space:pre-line;">"${archetype.directRead}"</div>
      <br>
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#0D1028;border-radius:10px;">
        <tr><td style="padding:32px;text-align:center;color:#fff;">
          <h4 style="color:#fff;font-family:Georgia,serif;font-size:20px;margin:0 0 12px;">The Next Step: A 90-Minute Clarity Intensive</h4>
          <a href="https://www.phoenixclearinsight.com/book" style="display:inline-block;background:#D4A056;color:#0D1028;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:14px;">Book Your Clarity Session ($497) →</a>
        </td></tr>
      </table>
    </td></tr>
    <tr><td style="background:#EDE8DF;padding:28px;text-align:center;font-size:12px;color:#6B6B7B;">
      <p style="margin:0 0 6px;font-weight:700;color:#0D1028;">✦ VETA P. HURST, ESQ., ICF-ACC</p>
      <p style="margin:0;">Founder &amp; Principal Coach, Phoenix Clear Insight</p>
    </td></tr>
  </table>
</div>`;
}

/* ── Run ── */
async function main() {
  console.log('\n🔍  Phoenix Email System — Smoke Test');
  console.log('─────────────────────────────────────');
  console.log('  API Key :', RESEND_API_KEY ? `re_***${RESEND_API_KEY.slice(-6)}` : '❌ MISSING');
  console.log('  From    :', FROM_EMAIL || '❌ MISSING');
  console.log('  To      :', TO_EMAIL || '(dry run — pass recipient as CLI arg)');
  console.log('  Archetype:', mockData.archetype);
  console.log('  Score   :', mockData.score, '/ 100');
  console.log('  DimScores:', mockData.dimScores.join(', '), '(each /25)\n');

  if (!TO_EMAIL) {
    console.log('ℹ️  No recipient supplied — printing HTML preview only.\n');
    console.log('──────────── EMAIL HTML PREVIEW ────────────');
    console.log(buildEmailHTML(mockData));
    console.log('────────────────────────────────────────────');
    console.log('\nTo send a real email, run:\n  node src/api/testEmail.mjs your@email.com\n');
    return;
  }

  if (!RESEND_API_KEY) {
    console.error('❌ VITE_RESEND_API_KEY is missing from .env — cannot send.');
    process.exit(1);
  }
  if (!FROM_EMAIL) {
    console.error('❌ VITE_RESEND_FROM_EMAIL is missing from .env — cannot send.');
    process.exit(1);
  }

  console.log('📤  Sending via Resend API …');

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'onboarding@resend.dev', // temp: bypasses domain verification
      to: [TO_EMAIL],
      subject: '[TEST] Your Personal Phoenix Clarity Assessment Report',
      html: buildEmailHTML(mockData),
      text: `Dear ${mockData.firstName},\n\nYour clarity score: ${mockData.score}/100\nArchetype: Phoenix Momentum\n\nBook your session: https://www.phoenixclearinsight.com/book`,
    }),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    console.error('❌  Resend API error:', response.status, payload?.message || payload?.error || JSON.stringify(payload));
    process.exit(1);
  }

  console.log('✅  Email sent successfully!');
  console.log('   Message ID :', payload?.id);
  console.log('   Status     :', response.status);
  console.log('\nCheck your inbox (and spam folder) for the test report.\n');
}

main().catch((err) => {
  console.error('❌  Unexpected error:', err.message);
  process.exit(1);
});
