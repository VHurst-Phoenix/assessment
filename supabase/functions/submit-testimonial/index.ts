import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const bandByKey: Record<string, string> = {
  transitioner: 'Transitioner',
  strategist: 'Strategist',
  executor: 'Executor',
  phoenix: 'Phoenix',
};

const validBands = new Set(Object.values(bandByKey));
const validSegments = new Set(['Individual', 'Corporate', 'Federal']);

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Method not allowed.' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  try {
    const body = await req.json();
    const email = String(body.email || '').trim().toLowerCase();
    if (!body.firstName || !body.lastName || !email || !body.before || !body.shift || !body.after) {
      return new Response(JSON.stringify({ error: 'Please complete all required story fields.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const url = Deno.env.get('SUPABASE_URL') || '';
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    if (!url || !serviceRoleKey) throw new Error('Testimonial matching is not configured.');
    const supabase = createClient(url, serviceRoleKey);

    const { data: assessments, error: lookupError } = await supabase
      .from('assessments')
      .select('id, archetype, segment, created_at')
      .ilike('email', email)
      .order('created_at', { ascending: true });
    if (lookupError) throw lookupError;

    const matched = (assessments || []).filter((assessment) => bandByKey[assessment.archetype]);
    const first = matched[0];
    const latest = matched.at(-1);
    const verifiedBand = latest ? bandByKey[latest.archetype] : null;
    const suppliedBand = validBands.has(body.band) ? body.band : null;
    const suppliedSegment = validSegments.has(body.segment) ? body.segment : null;

    const testimonial = {
      first_name: String(body.firstName).trim(),
      last_name: String(body.lastName).trim(),
      email,
      role: body.role ? String(body.role).trim() : null,
      anonymous: body.anonymous === 'Yes' ? 'Yes' : 'No',
      segment: latest?.segment || suppliedSegment,
      // Keep stage in sync for old client-story pages and exported legacy rows.
      stage: verifiedBand || suppliedBand,
      band: verifiedBand || suppliedBand,
      band_source: verifiedBand ? 'verified' : 'self-reported',
      show_band: body.showBand !== false,
      matched_assessment_id: latest?.id || null,
      before_band: matched.length >= 2 ? bandByKey[first.archetype] : null,
      after_band: verifiedBand,
      before: String(body.before).trim(),
      shift: String(body.shift).trim(),
      after: String(body.after).trim(),
      status: 'Pending Review',
    };

    const { data, error } = await supabase.from('testimonials').insert(testimonial).select('*').single();
    if (error) throw error;
    return new Response(JSON.stringify({ testimonial: data }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('submit-testimonial error', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unable to save testimonial.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
