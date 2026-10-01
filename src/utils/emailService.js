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
import { clarityDimensions } from '../pages/assessmentQuestions';
import { getCategoryScores, getFrictionVector, getGrowthEdge, getPosition, getRawTotal, getScoringBand, getScoringBandByKey } from '../pages/scoringBands';

const formatScore = (score) => Number.isInteger(score) ? String(score) : Number(score).toFixed(1);

const getTier = (score) => (Number(score) < 8 ? 'Emerging' : Number(score) < 12 ? 'Developing' : Number(score) < 16 ? 'Strong' : 'Exceptional');
const getTierIndex = (score) => ['Emerging', 'Developing', 'Strong', 'Exceptional'].indexOf(getTier(score));
const dimensionNarratives = [
  ["Naming your own strengths plainly is harder than it should be right now. The work is to notice your real capability and build the language and confidence to claim it.", "You can point to a few strengths, but the picture is still partial. The next step is to name and use the strengths you already sense more consistently.", "You have a mostly accurate picture of what you are good at and are using it. The edge is full-time deployment: bringing your sharpest strengths into more of your work.", "You know what you are good at, say so without hedging, and use it consistently. Your edge is stewardship: keep choosing work that actually uses it."],
  ["What matters most to you has not been clearly named yet, which makes it hard to notice when daily choices contradict it. Start by separating what is yours from other people's priorities.", "You have a rough sense of what matters, but it is not yet specific enough to guide decisions. Naming that specificity is the next unlock.", 'You can name what matters with real clarity, and most choices reflect it. Watch for moments of pressure or transition, when expedience can displace a values match.', 'Your values are clear, named, and consistently reflected in how you spend your time. The edge is holding that clarity steady through the next big change.'],
  ["A learned pattern may be shaping what you do or avoid without much conscious input. This is not a skills gap; naming the pattern precisely is most of the work.", 'You can sense something getting in your way, but the trigger, protection, and cost are not fully mapped. A precise map turns insight into behavior change.', "You have identified a main pattern and are interrupting it more often than not. Expect it to resurface in a new disguise, especially under stress.", 'You have working clarity on your patterns, triggers, and early warning signs. The edge is sustaining this choice-led way of operating.'],
  ["Where you are headed is still foggy, so every opportunity has to be judged in isolation. This is what direction feels like before it has had a chance to form.", 'You have a general sense of direction, enough to rule some things out. The next stage is precision about the options already in front of you.', "Your direction is clear and you recognize real opportunity. The edge is sequencing: knowing what is next, not just what is possible.", 'Your direction actively shapes which opportunities you pursue and which you let pass. Protect it from well-meaning noise as your options expand.'],
  ["There is a gap between what you know about yourself and what you can act on with confidence. The issue is not capability; it is trust in capability already present.", 'You are becoming more consistent, but confidence changes with the context or audience. That variation is useful data about where doubt is concentrated.', "You are operating from mostly steady confidence, and your actions increasingly match what you believe. Expect a new arena to test whether that confidence transfers.", 'What you believe, say, and do are closely matched across most contexts. Stay open enough to update that hard-won confidence when the situation calls for it.'],
];
const positionNarratives = {
  'System Evaluator': 'Direction and values are still forming, and outward action and confidence have not fully engaged yet. The work is not to force momentum before it is earned, but to get sharper about what you actually want.',
  'Strategic Planner': 'You know where you are headed and why it matters. What has not caught up is the outward action that turns a clear plan into visible motion. What remains is permission and follow-through, not more analysis.',
  'Kinetic Operator': 'Your strengths are active and your confidence reads as real. Periodically look up from the doing and confirm that the direction is still the one you would choose.',
  'Momentum Builder': 'You are clear on what matters and where you are headed, and actively building toward it. Protect that clarity and momentum through deliberate maintenance.',
};
const frictionNarratives = {
  'Self-Discounter': 'The friction traces back to values that have not been fully claimed as yours. The work is permission to name what you actually want, separate from what is expected of you.',
  'Vision Staller': 'You have a sense of what matters, but turning it into a specific direction has stalled. The values have not yet been converted into a destination you can move toward.',
  'Imposter Protector': 'There is hesitation around fully owning and deploying what you are genuinely good at. The drag is a permission gap, not a skills gap.',
  'The Magnifier': 'Overanalyzing, over-preparing, or second-guessing is slowing down how confidently you act. Scrutiny is running louder than the confidence you have earned.',
};

/**
 * Fix 1: Veta gets a BCC copy of every outbound results email so she has
 * visibility into exactly what clients receive. BCC (not CC) keeps this
 * invisible to the participant — their copy is unchanged.
 */
const INTERNAL_NOTIFICATION_EMAIL = 'veta.hurst@phoenixclearinsight.com';

/* ── HTML email builder ── */
function buildEmailHTML(data) {
  const score = Math.max(0, Number(data.score) || 0);
  const rawScore = Number(data.rawScore ?? getRawTotal(data.answers)) || 0;
  const band = getScoringBandByKey(data.archetype) || getScoringBand(score);
  // Prefer source responses so email reports always use the current
  // reverse-aware scoring model. dimScores is retained as a legacy fallback
  // for records whose response payload is unavailable.
  const categoryScores = Array.isArray(data.answers) && data.answers.length === clarityDimensions.length * 5
    ? getCategoryScores(data.answers)
    : Array.isArray(data.dimScores) ? data.dimScores : [];
  const firstName = data.firstName || 'there';
  const position = getPosition(categoryScores);
  const frictionVector = getFrictionVector(categoryScores, position);
  const growthEdge = getGrowthEdge(categoryScores);

  const dimensionRows = categoryScores
    .map((catScore, idx) => {
      const statusText = getTier(catScore);
      const narrative = dimensionNarratives[idx][getTierIndex(catScore)];
      const tierStyles = { Emerging: ['#FAECEE', '#8B2635'], Developing: ['#FBF8E8', '#927200'], Strong: ['#EAF4EF', '#2D6A4F'], Exceptional: ['#E9EEF9', '#263B82'] };
      const [statusBg, statusColor] = tierStyles[statusText];

      return `
        <tr>
          <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;">
            <strong style="color:#0D1028;font-size:14px;display:block;">${clarityDimensions[idx]}</strong>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;text-align:center;">
            <span style="background:${statusBg};color:${statusColor};font-size:11px;font-weight:700;padding:4px 10px;border-radius:20px;text-transform:uppercase;letter-spacing:0.02em;">${statusText}</span>
          </td>
          <td style="padding:12px 14px;border-bottom:1px solid #EDE8DF;text-align:right;">
            <strong style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:16px;">${formatScore(catScore)}/20</strong>
          </td>
        </tr>
        <tr>
          <td colspan="3" style="padding:0 14px 16px;border-bottom:1px solid #EDE8DF;color:#6B6B7B;font-size:12px;line-height:1.6;">${narrative}</td>
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
              <h1 style="color:#FFFFFF;font-family:'Playfair Display',Georgia,serif;font-size:28px;margin:0;font-weight:700;letter-spacing:0.01em;">Your Complete Clarity Report</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">

              <!-- Greeting -->
              <p style="font-size:16px;color:#0D1028;font-weight:600;margin:0 0 16px 0;">Dear ${firstName},</p>
              <p style="font-size:14px;color:#6B6B7B;line-height:1.65;margin:0 0 24px 0;">
                Thank you for completing the Phoenix Clarity Assessment. This complete report includes your Band, Position, Friction Vector, Growth Edge, and detailed reflection across all five dimensions.
              </p>

              <!-- Overall Score -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;border-radius:8px;border:1px solid #EDE8DF;margin-bottom:28px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                     <div style="font-size:11px;font-weight:800;color:#6B6B7B;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">YOUR CLARITY SCORE</div>
                     <div style="margin-bottom:12px;">
                       <span style="font-size:56px;font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-weight:700;line-height:1;">${formatScore(score)}</span>
                       <span style="font-size:16px;color:#6B6B7B;"> / 100</span>
                     </div>
                     <div style="font-size:12px;color:#6B6B7B;margin:-4px 0 12px;">Adjusted response total: ${formatScore(rawScore)} / 125</div>
                    <div style="display:inline-block;background-color:#0D1028;color:#D4A056;font-size:14px;font-weight:700;padding:8px 24px;border-radius:30px;letter-spacing:0.02em;">
                      ${band?.label || 'Clarity Assessment'}
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Dimension Breakdown -->
              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 16px 0;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;font-weight:700;">The Five Dimensions Breakdown</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
                ${dimensionRows}
              </table>

              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 12px;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;">Your Position</h3>
              <div style="background:#F7F4EF;border-left:4px solid #D4A056;padding:18px 20px;margin:0 0 24px;">
                <strong style="font-family:Georgia,serif;color:#0D1028;font-size:18px;display:block;margin-bottom:7px;">${position?.quadrant || 'Not available'}</strong>
                <p style="font-size:13px;color:#1C1C1C;line-height:1.65;margin:0 0 9px;">${position ? positionNarratives[position.quadrant] : 'Your Position will be available once all category scores are present.'}</p>
                <div style="font-size:11px;color:#6B6B7B;font-weight:700;">Inner Clarity: ${position ? formatScore(position.innerAxis) : '—'} / 40 &nbsp;·&nbsp; Outer Action: ${position ? formatScore(position.outerAxis) : '—'} / 40</div>
              </div>
              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 12px;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;">Your Friction Vector</h3>
              <div style="background:#F7F4EF;border-left:4px solid #D4A056;padding:18px 20px;margin:0 0 24px;">
                <strong style="font-family:Georgia,serif;color:#0D1028;font-size:18px;display:block;margin-bottom:7px;">${frictionVector?.archetype || 'Not available'}</strong>
                <p style="font-size:13px;color:#1C1C1C;line-height:1.65;margin:0 0 9px;">${frictionVector ? frictionNarratives[frictionVector.archetype] : 'Your Friction Vector will be available once all category scores are present.'}</p>
                <div style="font-size:11px;color:#6B6B7B;font-weight:700;">Lagging axis: ${frictionVector?.lowerAxis === 'inner' ? 'Inner Clarity' : frictionVector ? 'Outer Action' : '—'} &nbsp;·&nbsp; Focus dimension: ${frictionVector?.weakerDimension || '—'}</div>
              </div>
              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 12px;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;">Your Growth Edge</h3>
              <div style="background:#0D1028;border-radius:10px;padding:20px;margin:0 0 30px;">
                <strong style="font-family:Georgia,serif;color:#FFFFFF;font-size:18px;display:block;margin-bottom:5px;">${growthEdge ? clarityDimensions[growthEdge.index] : 'Not available'}</strong>
                <div style="font-size:12px;color:#D4A056;font-weight:800;margin-bottom:9px;">${growthEdge ? formatScore(growthEdge.score) + ' / 20 · ' + getTier(growthEdge.score) : ''}</div>
                <p style="font-size:13px;color:rgba(255,255,255,.75);line-height:1.65;margin:0;">${growthEdge ? dimensionNarratives[growthEdge.index][getTierIndex(growthEdge.score)] : 'Your Growth Edge will be available once all category scores are present.'}</p>
              </div>

              <!-- Veta's Direct Read -->
              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 12px 0;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;font-weight:700;">My Direct Read of Your Scores</h3>
              <div style="font-size:14px;color:#1C1C1C;font-style:italic;background-color:#FDFDFD;border-left:4px solid #D4A056;padding:20px;line-height:1.75;margin:0 0 32px 0;border-radius:0 8px 8px 0;box-shadow:inset 0 1px 3px rgba(0,0,0,0.02);white-space:pre-line;">
"${band?.directRead || 'Your results are ready for review with your coach.'}"
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
  const score = Math.max(0, Number(data.score) || 0);
  const rawScore = Number(data.rawScore ?? getRawTotal(data.answers)) || 0;
  const band = getScoringBandByKey(data.archetype) || getScoringBand(score);
  const categoryScores = Array.isArray(data.answers) && data.answers.length === clarityDimensions.length * 5
    ? getCategoryScores(data.answers)
    : Array.isArray(data.dimScores) ? data.dimScores : [];
  const position = getPosition(categoryScores);
  const frictionVector = getFrictionVector(categoryScores, position);
  const growthEdge = getGrowthEdge(categoryScores);
  const dimensions = categoryScores.map((categoryScore, index) => [
    clarityDimensions[index] + ': ' + formatScore(categoryScore) + '/20 — ' + getTier(categoryScore),
    dimensionNarratives[index][getTierIndex(categoryScore)],
  ].join('\n')).join('\n\n');

  return [
    'Dear ' + (data.firstName || 'there') + ',',
    '',
    'Your complete Phoenix Clarity Assessment report',
    '',
    'Clarity score: ' + formatScore(score) + '/100',
    'Adjusted response total: ' + formatScore(rawScore) + '/125',
    'Band: ' + (band?.label || '—'),
    '',
    'YOUR BAND',
    band?.intro || 'Your results are ready for review.',
    '',
    'YOUR FIVE DIMENSIONS',
    dimensions,
    '',
    'YOUR POSITION: ' + (position?.quadrant || 'Not available'),
    position ? 'Inner Clarity: ' + formatScore(position.innerAxis) + '/40 | Outer Action: ' + formatScore(position.outerAxis) + '/40\n' + positionNarratives[position.quadrant] : '',
    '',
    'YOUR FRICTION VECTOR: ' + (frictionVector?.archetype || 'Not available'),
    frictionVector ? frictionNarratives[frictionVector.archetype] + '\nFocus dimension: ' + frictionVector.weakerDimension : '',
    '',
    'YOUR GROWTH EDGE: ' + (growthEdge ? clarityDimensions[growthEdge.index] : 'Not available'),
    growthEdge ? formatScore(growthEdge.score) + '/20 — ' + getTier(growthEdge.score) + '\n' + dimensionNarratives[growthEdge.index][getTierIndex(growthEdge.score)] : '',
    '',
    'MY DIRECT READ OF YOUR SCORES',
    band?.directRead || 'Your results are ready for review with your coach.',
    '',
    'Book your Clarity Session: https://phoneixclearinsight.as.me/schedule/e8a7e423/appointment/92792406/calendar/14034515',
  ].filter(Boolean).join('\n');
}

/* ── Main email sender ── */
export const sendAssessmentEmail = async (assessmentData, signal) => {
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
    subject: 'Your Complete Phoenix Clarity Assessment Report',
    html: emailHTML,
    text: buildEmailText(assessmentData),
    signal,
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
