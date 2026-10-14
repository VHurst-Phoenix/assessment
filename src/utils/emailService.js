/**
 * Email Service for Phoenix Assessment Platform
 * ─────────────────────────────────────────────
 * Sends the short Clarity summary email through Resend. The complete
 * Clarity Report is a PDF the coach releases from the dashboard after the
 * client books the Clarity Intensive (see release-clarity-report function).
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
import { buildClarityReport, formatScore } from '../pages/clarityReport';
import { CLARITY_INTENSIVE_URL, DISCOVERY_CALL_URL, PROGRAM_URL } from '../config/booking';

/**
 * Fix 1: Veta gets a BCC copy of every outbound results email so she has
 * visibility into exactly what clients receive. BCC (not CC) keeps this
 * invisible to the participant — their copy is unchanged.
 */
const INTERNAL_NOTIFICATION_EMAIL = 'veta.hurst@phoenixclearinsight.com';

export const SUMMARY_EMAIL_SUBJECT = 'Your Phoenix Clarity Assessment Summary';

const escapeHtml = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

const teaserRow = (label, value) => `
                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid #EDE8DF;font-size:12px;font-weight:700;color:#6B6B7B;letter-spacing:0.06em;text-transform:uppercase;">${label}</td>
                  <td style="padding:10px 0;border-bottom:1px solid #EDE8DF;text-align:right;font-family:'Playfair Display',Georgia,serif;font-size:16px;font-weight:700;color:#0D1028;">${escapeHtml(value || '—')}</td>
                </tr>`;

/* ── HTML email builder ── */
function buildEmailHTML(data) {
  const report = buildClarityReport(data);
  const firstName = escapeHtml(report.firstName || 'there');

  return `
<div style="margin:0;padding:30px 15px;background-color:#F7F4EF;font-family:'DM Sans',Helvetica,Arial,sans-serif;color:#1C1C1C;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#FFFFFF;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);border:1px solid #EDE8DF;">

          <tr>
            <td style="background-color:#0D1028;padding:36px 32px;text-align:center;border-bottom:3px solid #D4A056;">
              <div style="color:#D4A056;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">Phoenix Clear Insight</div>
              <h1 style="color:#FFFFFF;font-family:'Playfair Display',Georgia,serif;font-size:26px;margin:0;font-weight:700;">Your Clarity Assessment Summary</h1>
            </td>
          </tr>

          <tr>
            <td style="padding:32px;">
              <p style="font-size:16px;color:#0D1028;font-weight:600;margin:0 0 16px 0;">Dear ${firstName},</p>
              <p style="font-size:14px;color:#6B6B7B;line-height:1.65;margin:0 0 24px 0;">
                Thank you for completing the Phoenix Clarity Assessment. Here is a summary of where you are right now.
              </p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F7F4EF;border-radius:8px;border:1px solid #EDE8DF;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px;text-align:center;">
                    <div style="font-size:11px;font-weight:800;color:#6B6B7B;letter-spacing:0.12em;text-transform:uppercase;margin-bottom:8px;">Your Clarity Score</div>
                    <div style="margin-bottom:12px;">
                      <span style="font-size:56px;font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-weight:700;line-height:1;">${formatScore(report.score)}</span>
                      <span style="font-size:16px;color:#6B6B7B;"> / 100</span>
                    </div>
                    <div style="display:inline-block;background-color:#0D1028;color:#D4A056;font-size:14px;font-weight:700;padding:8px 24px;border-radius:30px;">
                      ${escapeHtml(report.band?.label || 'Clarity Assessment')}
                    </div>
                  </td>
                </tr>
              </table>

              <div style="font-size:14px;color:#1C1C1C;line-height:1.75;margin:0 0 28px;white-space:pre-line;">${escapeHtml(report.band?.intro || '')}</div>

              <h3 style="font-family:'Playfair Display',Georgia,serif;color:#0D1028;font-size:18px;margin:0 0 8px;border-bottom:1.5px solid #EDE8DF;padding-bottom:8px;">Your Clarity Profile at a Glance</h3>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
                ${teaserRow('Position', report.position?.quadrant)}
                ${teaserRow('Friction Vector', report.frictionVector?.archetype)}
                ${teaserRow('Growth Edge', report.growthEdge?.name)}
              </table>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0D1028;border-radius:10px;overflow:hidden;">
                <tr>
                  <td style="padding:32px 24px;text-align:center;color:#FFFFFF;">
                    <h4 style="color:#FFFFFF;font-family:'Playfair Display',Georgia,serif;font-size:20px;margin:0 0 12px 0;font-weight:700;">Your Complete Clarity Report</h4>
                    <p style="color:rgba(255,255,255,0.75);font-size:13px;line-height:1.65;margin:0 0 22px 0;">
                      Your complete report explains what your Position, Friction Vector and Growth Edge mean for you, with a detailed read of all five dimensions and my direct read of your results. It is released as a PDF when you book your Clarity Intensive.
                    </p>
                    <a href="${CLARITY_INTENSIVE_URL}" style="display:inline-block;background-color:#D4A056;color:#0D1028;font-weight:800;padding:14px 28px;border-radius:6px;text-decoration:none;font-size:14px;">
                      Book Your Clarity Intensive →
                    </a>
                    <p style="margin:16px 0 0;font-size:13px;line-height:1.5;">
                      <a href="${DISCOVERY_CALL_URL}" style="color:#D4A056;font-weight:700;text-decoration:underline;">Not ready yet? Book a free Discovery call →</a>
                    </p>
                    <p style="margin:10px 0 0;font-size:12px;line-height:1.5;">
                      <a href="${PROGRAM_URL}" style="color:rgba(255,255,255,0.6);text-decoration:underline;">Learn more about the Phoenix Clear Insight program</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

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
  const report = buildClarityReport(data);
  return [
    'Dear ' + (report.firstName || 'there') + ',',
    '',
    'Thank you for completing the Phoenix Clarity Assessment. Here is a summary of where you are right now.',
    '',
    'Clarity score: ' + formatScore(report.score) + '/100',
    'Band: ' + (report.band?.label || '—'),
    '',
    report.band?.intro || '',
    '',
    'YOUR CLARITY PROFILE AT A GLANCE',
    'Position: ' + (report.position?.quadrant || '—'),
    'Friction Vector: ' + (report.frictionVector?.archetype || '—'),
    'Growth Edge: ' + (report.growthEdge?.name || '—'),
    '',
    'YOUR COMPLETE CLARITY REPORT',
    'Your complete report explains what your Position, Friction Vector and Growth Edge mean for you, with a detailed read of all five dimensions and my direct read of your results. It is released as a PDF when you book your Clarity Intensive.',
    '',
    'Book your Clarity Intensive: ' + CLARITY_INTENSIVE_URL,
    'Not ready yet? Book a free Discovery call: ' + DISCOVERY_CALL_URL,
    'Learn more about the Phoenix Clear Insight program: ' + PROGRAM_URL,
  ].join('\n');
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

  const result = await sendEmail({
    to: assessmentData.email,
    bcc: INTERNAL_NOTIFICATION_EMAIL,
    subject: SUMMARY_EMAIL_SUBJECT,
    html: buildEmailHTML(assessmentData),
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
 * Export the builders so the results-page preview and the dashboard's
 * Client Email View render exactly what the client receives.
 */
export { buildEmailHTML, buildEmailText };
