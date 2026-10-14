-- Complete Clarity Report (PDF) storage and coach-controlled release.
-- The public results page and summary email no longer contain the full
-- report; the coach stores the PDF from the dashboard and releases it to the
-- client after they book the Clarity Intensive.

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS report_pdf_path text,
  ADD COLUMN IF NOT EXISTS report_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_released_at timestamptz;

-- Anonymous submissions must never set the report fields. Every other check
-- matches 20261014120000_clarity_consent_notice_v2.sql.
DROP POLICY IF EXISTS public_submit_assessments ON public.assessments;

CREATE POLICY public_submit_assessments ON public.assessments
  AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 100
    AND char_length(last_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 320
    AND (company IS NULL OR char_length(company) <= 200)
    AND (segment IS NULL OR segment IN ('Individual', 'Corporate', 'Federal'))
    AND (identity IS NULL OR char_length(identity) <= 100)
    AND (source IS NULL OR char_length(source) <= 500)
    AND (context IS NULL OR char_length(context) <= 4000)
    AND jsonb_typeof(responses) = 'array'
    AND jsonb_array_length(responses) = 25
    AND raw_score BETWEEN 25 AND 125
    AND score BETWEEN 0 AND 100
    AND archetype IN ('transitioner', 'strategist', 'executor', 'phoenix')
    AND jsonb_typeof(dim_scores) = 'array'
    AND jsonb_array_length(dim_scores) = 5
    AND consent_timestamp IS NOT NULL
    AND consent_version IN ('2026-09-05', '2026-10-14')
    AND report_pdf_path IS NULL
    AND report_generated_at IS NULL
    AND report_released_at IS NULL
    AND created_at BETWEEN now() - INTERVAL '10 minutes' AND now() + INTERVAL '1 minute'
  );

-- Private bucket: PDFs are only reachable by signed-in admins (and by the
-- release-clarity-report function, which uses the service role).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clarity-reports', 'clarity-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS admin_manage_clarity_reports ON storage.objects;

CREATE POLICY admin_manage_clarity_reports ON storage.objects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (bucket_id = 'clarity-reports' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'clarity-reports' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
