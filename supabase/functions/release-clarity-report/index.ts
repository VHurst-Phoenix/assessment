// Releases a stored Complete Clarity Report PDF to the client.
//
// Only a signed-in admin (app_metadata.role = 'admin') may call this. The
// recipient is always the email on the assessment record — never a value
// from the request — so this cannot be used to send mail elsewhere.
//
// Secrets: RESEND_API_KEY, RESEND_FROM_EMAIL (optional), REPORT_REPLY_TO (optional).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { serve } from 'https://deno.land/std@0.208.0/http/server.ts';

// Inlined (rather than imported from ../_shared) so this file can be pasted
// directly into the Supabase dashboard's function editor.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BUCKET = 'clarity-reports';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  try {
    const url = Deno.env.get('SUPABASE_URL') || '';
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const resendApiKey = Deno.env.get('RESEND_API_KEY') || '';
    if (!url || !anonKey || !serviceRoleKey || !resendApiKey) {
      return json({ error: 'Report release is not configured. Set RESEND_API_KEY as a function secret.' }, 500);
    }

    // 1. Caller must be a signed-in admin.
    const authHeader = req.headers.get('Authorization') || '';
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || userData?.user?.app_metadata?.role !== 'admin') {
      return json({ error: 'Only a signed-in coach can release reports.' }, 403);
    }

    const { assessmentId } = await req.json();
    if (!assessmentId) return json({ error: 'Missing assessmentId.' }, 400);

    // 2. Load the record and its stored PDF with the service role.
    const admin = createClient(url, serviceRoleKey);
    const { data: record, error: recordError } = await admin
      .from('assessments')
      .select('id, first_name, last_name, email, report_pdf_path')
      .eq('id', assessmentId)
      .single();
    if (recordError || !record) return json({ error: 'Assessment not found.' }, 404);
    if (!record.report_pdf_path) return json({ error: 'Generate and store the report before releasing it.' }, 409);

    const { data: file, error: fileError } = await admin.storage.from(BUCKET).download(record.report_pdf_path);
    if (fileError || !file) return json({ error: 'The stored report PDF could not be read.' }, 500);
    const pdfBase64 = toBase64(new Uint8Array(await file.arrayBuffer()));

    // 3. Email it to the client on file.
    const firstName = escapeHtml(record.first_name || 'there');
    const fileName = `Phoenix_Clarity_Report_${record.first_name || ''}_${record.last_name || ''}.pdf`.replace(/\s+/g, '_');
    const replyTo = Deno.env.get('REPORT_REPLY_TO');
    const html = `
<div style="margin:0;padding:30px 15px;background:#F7F4EF;font-family:Helvetica,Arial,sans-serif;color:#1C1C1C;">
  <div style="max-width:600px;margin:0 auto;background:#FFFFFF;border:1px solid #EDE8DF;border-radius:12px;overflow:hidden;">
    <div style="background:#0D1028;padding:32px;text-align:center;border-bottom:3px solid #D4A056;">
      <div style="color:#D4A056;font-size:12px;font-weight:800;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:8px;">Phoenix Clear Insight</div>
      <h1 style="color:#FFFFFF;font-family:Georgia,serif;font-size:26px;margin:0;">Your Complete Clarity Report</h1>
    </div>
    <div style="padding:32px;font-size:14px;line-height:1.7;">
      <p style="margin:0 0 16px;font-weight:600;color:#0D1028;">Dear ${firstName},</p>
      <p style="margin:0 0 16px;">Thank you for booking your Clarity Intensive. Your complete Phoenix Clarity Report is attached as a PDF.</p>
      <p style="margin:0 0 16px;">It explains your Band, your Position, your Friction Vector and your Growth Edge, with a detailed read of all five dimensions. Please read it before our session and bring any questions it raises.</p>
      <p style="margin:24px 0 0;font-weight:700;color:#0D1028;">Veta P. Hurst, Esq., ICF-ACC</p>
      <p style="margin:0;color:#6B6B7B;">Founder &amp; Principal Coach, Phoenix Clear Insight</p>
    </div>
  </div>
</div>`;
    const text = `Dear ${record.first_name || 'there'},\n\nThank you for booking your Clarity Intensive. Your complete Phoenix Clarity Report is attached as a PDF.\n\nIt explains your Band, your Position, your Friction Vector and your Growth Edge, with a detailed read of all five dimensions. Please read it before our session and bring any questions it raises.\n\nVeta P. Hurst, Esq., ICF-ACC\nFounder & Principal Coach, Phoenix Clear Insight`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: Deno.env.get('RESEND_FROM_EMAIL') || 'Phoenix Clear Insight <onboarding@resend.dev>',
        to: [record.email],
        subject: 'Your Complete Phoenix Clarity Report',
        html,
        text,
        ...(replyTo ? { reply_to: replyTo } : {}),
        attachments: [{ filename: fileName, content: pdfBase64 }],
      }),
    });
    const resendData = await resendResponse.json().catch(() => ({}));
    if (!resendResponse.ok) {
      console.error('Resend error', resendData);
      return json({ error: resendData?.message || resendData?.error || 'The report email could not be sent.' }, 502);
    }

    // 4. Record the release.
    const releasedAt = new Date().toISOString();
    const { error: updateError } = await admin
      .from('assessments')
      .update({ report_released_at: releasedAt })
      .eq('id', assessmentId);
    if (updateError) {
      console.error('Release recorded email but failed to update record', updateError);
      return json({ error: 'The report was emailed, but the release date could not be saved.', emailId: resendData?.id }, 500);
    }

    return json({ success: true, releasedAt, emailId: resendData?.id });
  } catch (error) {
    console.error('release-clarity-report error', error);
    return json({ error: error instanceof Error ? error.message : 'Unable to release the report.' }, 500);
  }
});
