/**
 * Email Service for Phoenix Assessment Platform
 * ─────────────────────────────────────────────
 * Sends assessment results to the user's email through Resend.
 *
 * Delivery path (see resendClient.js):
 *   1. VITE_EMAIL_API_URL — optional custom backend proxy
 *   2. Supabase `send-email` edge function — recommended (Resend key stays server-side)
 *   3. Direct browser Resend call — dev fallback only
 *
 * Required Supabase secrets (Edge Functions → Secrets):
 *   RESEND_API_KEY
 *   RESEND_FROM_EMAIL  — e.g. Phoenix Clear Insight <noreply@phoenixclearinsight.com>
 *
 * Deploy: supabase functions deploy send-email --project-ref kmrambclpujmnyxbfkjh
 */

import { sendEmail } from '../lib/resendClient';

/* ── Archetype data (mirror of completion page) ── */
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

/**
 * Fix 1: Veta gets a BCC copy of every outbound results email so she has
 * visibility into exactly what clients receive. BCC (not CC) keeps this
 * invisible to the participant — their copy is unchanged.
 */
const INTERNAL_NOTIFICATION_EMAIL = 'veta.hurst@phoenixclearinsight.com';

/* ── HTML email builder ── */
function buildEmailHTML(data) {
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));
  const archetype = archetypes[data.archetype] || archetypes.awakening;
  const dimScores = Array.isArray(data.dimScores) ? data.dimScores : [0, 0, 0, 0, 0];
  const firstName = data.firstName || 'there';

  const dimensionRows = dimScores
    .map((rawScore, idx) => {
      const numScore = Math.max(0, Math.min(25, Number(rawScore) || 0));
      const pct = Math.round((numScore / 25) * 100);
      const scaledOf20 = Math.round((numScore / 25) * 20);
      const statusText = pct >= 72 ? 'Active' : pct >= 52 ? 'Developing' : 'Emerging';
      const statusBg = pct >= 72 ? '#EAF4EF' : pct >= 52 ? '#FBF8E8' : '#FAECEE';
      const statusColor = pct >= 72 ? '#2D6A4F' : pct >= 52 ? '#B08A00' : '#8B2635';

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;">
            <strong style="color:#0D1028;font-size:14px;display:block;">${dimLabels[idx]}</strong>
            <span style="color:#D4A056;font-size:11px;text-transform:uppercase;font-weight:600;letter-spacing:0.04em;">${dimPhases[idx]}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;text-align:center;">
            <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.02em;">${statusText}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;text-align:right;">
            <strong style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:16px;">${scaledOf20}/20</strong>
          </td>
        </tr>`;
    })
    .join('');

  return `
<div style="margin:0;padding:30px 15px;background-color:#F7F4EF;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#1C1C1C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #EDE8DF;">

          <!-- Banner -->
          <tr>
            <td style="background-color:#0D1028;padding:36px 32px;text-align:center;border-bottom:3px solid #D4A056;">
              <div style="color:#D4A056;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">Phoenix Clear Insight</div>
              <h1 style="color:#FFFFFF;font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;font-weight:700;letter-spacing:0.01em;">Your Clarity Report</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <!-- Greeting -->
              <p style="font-size:16px;color:#0D1028;font-weight:600;margin:0 0 16px 0;">Dear ${firstName},</p>
              <p style="font-size:14px;color:#6B6B7B;line-height:1.65;margin:0 0 24px 0;">
                Thank you for completing the Phoenix Clarity Assessment. This report summarizes your progress across our 5 clarity dimensions and holds a mirror to what your next developmental chapter requires.
              </p>

              <!-- Overall Score -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;border-radius:8px;border:1px solid #EDE8DF;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:11px;font-weight:800;color:#6B6B7B;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">YOUR CLARITY SCORE</div>
                    <div style="margin-bottom:12px;">
                      <span style="font-size:56px;font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-weight:700;line-height:1;">${score}</span>
                      <span style="font-size:16px;color:#6B6B7B;"> / 100</span>
                    </div>
                    <div style="display:inline-block;background-color:#0D1028;color:#D4A056;font-size:14px;font-weight:700;padding:8px 24px;border-radius:30px;letter-spacing:0.02em;">
                      ${archetype.name}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Dimension Breakdown -->
              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 16px 0;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;font-weight:700;">The Five Dimensions Breakdown</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                ${dimensionRows}
              </table>

              <!-- Veta's Direct Read -->
              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 12px 0;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;font-weight:700;">My Direct Read of Your Scores</h3>
              <div style="font-size:14px;color:#1C1C1C;font-style:italic;background-color:#FDFDFD;border-left:4px solid #D4A056;padding:20px;line-height:1.75;margin:0 0 32px 0;border-radius:0 8px 8px 0;box-shadow:inset 0 1px 3px rgba(0,0,0,0.02);white-space:pre-line;">
"${archetype.directRead}"
              </div>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D1028;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 24px;text-align:center;color:#FFFFFF;">
                    <h4 style="color:#FFFFFF;font-family:'Playfair Display',Georgia,serif;font-size:20px;margin:0 0 12px 0;font-weight:700;">The Next Step: A 90‑Minute Clarity Intensive</h4>
                    <p style="color:rgba(255,255,255,0.7);font-size:13px;line-height:1.65;margin:0 0 24px 0;">
                      We take what the assessment surfaced and turn it into a specific, actionable direction — in a single powerful session.
                    </p>
                    <a href="https://www.phoenixclearinsight.com/book" style="display:inline-block;background-color:#D4A056;color:#0D1028;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:14px;letter-spacing:0.02em;box-shadow:0 4px 10px rgba(212,160,86,0.3);">
                      Book Your Clarity Session ($497) →
                    </a>
                    <p style="color:rgba(255,255,255,0.35);font-size:12px;font-style:italic;margin:16px 0 0 0;">Scholarship pricing available. Ask about it during your discovery call.</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#EDE8DF;padding:28px;text-align:center;font-size:12px;color:#6B6B7B;border-top:1px solid #EDE8DF;">
              <p style="margin:0 0 6px 0;font-weight:700;color:#0D1028;letter-spacing:0.04em;">✦ VETA P. HURST, ESQ., ICF‑ACC</p>
              <p style="margin:0;">Founder &amp; Principal Coach, Phoenix Clear Insight</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</div>`;
}


function buildEmailText(data) {
  const archetype = archetypes[data.archetype] || archetypes.awakening;
  const firstName = data.firstName || 'there';
  const score = Math.max(0, Math.min(100, Number(data.score) || 0));

  return [
    `Dear ${firstName},`,
    '',
    'Thank you for completing the Phoenix Clarity Assessment.',
    '',
    `Your clarity score: ${score}/100`,
    `Your archetype: ${archetype.name}`,
    '',
    archetype.directRead,
    '',
    'Book your Clarity Session: https://www.phoenixclearinsight.com/book',
  ].join('\n');
}

/* ── Main email sender ── */
export const sendAssessmentEmail = async (assessmentData) => {
  if (!assessmentData) {
    throw new Error('Assessment data is required.');
  }

  if (!assessmentData.email) {
    throw new Error('Email address is required.');
  }

  if (!assessmentData.firstName) {
    throw new Error('First name is required.');
  }

  const emailHTML = buildEmailHTML(assessmentData);
  const result = await sendEmail({
    to: assessmentData.email,
    bcc: INTERNAL_NOTIFICATION_EMAIL,
    subject: 'Your Personal Phoenix Clarity Assessment Report',
    html: emailHTML,
    text: buildEmailText(assessmentData),
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return {
    success: true,
    method: 'Resend',
    response: result.data,
  };
};

/**
 * Export the HTML builder so the email preview modal
 * can render the exact same content the user receives.
 */
export { buildEmailHTML };