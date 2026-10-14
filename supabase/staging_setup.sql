-- STAGING / TEST DATABASE SETUP — generated 2026-10-14
-- Run once in a NEW, EMPTY Supabase project (SQL Editor -> New query -> paste -> Run).
-- Contents: src/api/create_tables.sql, then every file in supabase/migrations in order.
-- Do NOT run this against the live project; apply migrations there individually.

-- ============================================================
-- src\api\create_tables.sql
-- ============================================================
-- Create assessment table
CREATE TABLE IF NOT EXISTS public.assessments (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  company TEXT,
  segment TEXT,
  identity TEXT,
  source TEXT,
  context TEXT,
  responses JSONB,
  raw_score SMALLINT,
  score NUMERIC(5,2),
  archetype TEXT,
  dim_scores JSONB,          -- [clarity, confidence, action, alignment, readiness] raw scores (0–25 each)
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  consent_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- If the table already exists, add the column with:
-- ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS dim_scores JSONB;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS consent_version TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS raw_score SMALLINT;
ALTER TABLE public.assessments ALTER COLUMN score TYPE NUMERIC(5,2) USING score::NUMERIC;

CREATE INDEX IF NOT EXISTS idx_assessments_email ON public.assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments(created_at);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  anonymous TEXT DEFAULT 'No',
  email TEXT,
  role TEXT,
  stage TEXT,
  segment TEXT,
  band TEXT,
  band_source TEXT DEFAULT 'self-reported',
  show_band BOOLEAN DEFAULT true,
  matched_assessment_id BIGINT,
  before_band TEXT,
  after_band TEXT,
  before TEXT,
  shift TEXT,
  after TEXT,
  status TEXT DEFAULT 'Pending Review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS band TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS band_source TEXT DEFAULT 'self-reported';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_band BOOLEAN DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS matched_assessment_id BIGINT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS before_band TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS after_band TEXT;

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);

-- Create readiness table
CREATE TABLE IF NOT EXISTS public.readiness (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  segment TEXT,
  score NUMERIC(5,2),
  category_scores JSONB,
  band TEXT,
  gap TEXT,
  responses JSONB,           -- full array of coach rating answers
  session_type TEXT,         -- e.g. 'clarity-intensive' | 'week1'
  session_date DATE,         -- date of the session being evaluated
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  consent_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- If the table already exists, add the columns with:
-- ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS responses JSONB;
-- ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS session_type TEXT;
-- ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS session_date DATE;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS category_scores JSONB;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS band TEXT;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS gap TEXT;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS consent_version TEXT;
ALTER TABLE public.readiness ALTER COLUMN score TYPE NUMERIC(5,2) USING score::NUMERIC;

CREATE INDEX IF NOT EXISTS idx_readiness_email ON public.readiness(email);
CREATE INDEX IF NOT EXISTS idx_readiness_created_at ON public.readiness(created_at);

-- Create execution forms table
CREATE TABLE IF NOT EXISTS public.execution_forms (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  segment TEXT,
  score NUMERIC(5,2),
  category_scores JSONB,
  band TEXT,
  gap TEXT,
  program_checkpoint TEXT,
  responses JSONB,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  consent_timestamp TIMESTAMP WITH TIME ZONE,
  consent_version TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS company TEXT;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS category_scores JSONB;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS band TEXT;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS gap TEXT;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS program_checkpoint TEXT;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.execution_forms ADD COLUMN IF NOT EXISTS consent_version TEXT;

CREATE INDEX IF NOT EXISTS idx_execution_forms_email ON public.execution_forms(email);
CREATE INDEX IF NOT EXISTS idx_execution_forms_status ON public.execution_forms(status);
CREATE INDEX IF NOT EXISTS idx_execution_forms_created_at ON public.execution_forms(created_at);

-- RLS: public Clarity/Testimonial submissions may insert only; coach-console
-- actions require a Supabase user whose app_metadata.role is "admin".
-- Apply this migration in the target Supabase project, then verify each policy
-- in the dashboard before launch.
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_forms ENABLE ROW LEVEL SECURITY;

-- Remove every pre-existing policy before recreating the application's
-- allow-list. Policy names are mutable, so dropping only known names can leave
-- an old public SELECT policy in place and expose assessment records.
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('assessments', 'testimonials', 'readiness', 'execution_forms')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
  END LOOP;
END $$;

-- Public forms need INSERT only. Neither the anon key nor a regular signed-in
-- participant can read, modify, or delete submitted client data.
CREATE POLICY public_submit_assessments ON public.assessments
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY public_submit_testimonials ON public.testimonials
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Readiness and execution assessments are opened with the shared passcode in
-- the assessment portal. The browser submits their completed forms directly.
CREATE POLICY public_submit_readiness ON public.readiness
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY public_submit_execution_forms ON public.execution_forms
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Coach-console access is granted only to a Supabase user with this app
-- metadata claim. Set it through the service-role admin API, never the client.
CREATE POLICY admin_manage_assessments ON public.assessments
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_manage_testimonials ON public.testimonials
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_manage_readiness ON public.readiness
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_manage_execution_forms ON public.execution_forms
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- ============================================================
-- supabase\migrations\20260907120000_lock_down_assessment_rls.sql
-- ============================================================
-- Replace every legacy policy with the locked Phoenix Assessment policy set.
-- This is deliberately policy-name independent: a stale policy can otherwise
-- grant anonymous reads even when the expected policies have been updated.

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_forms ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('assessments', 'testimonials', 'readiness', 'execution_forms')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', policy_record.policyname, policy_record.tablename);
  END LOOP;
END $$;

-- Public-facing forms may insert data, but never read, update, or delete it.
CREATE POLICY public_submit_assessments ON public.assessments
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY public_submit_testimonials ON public.testimonials
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Readiness and Execution are coach-only forms; their data is managed only by
-- a signed-in user whose role is set server-side in app_metadata.
CREATE POLICY admin_manage_assessments ON public.assessments
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_manage_testimonials ON public.testimonials
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_manage_readiness ON public.readiness
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY admin_manage_execution_forms ON public.execution_forms
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');


-- ============================================================
-- supabase\migrations\20260907130000_add_testimonial_matching.sql
-- ============================================================
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS band TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS band_source TEXT DEFAULT 'self-reported';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_band BOOLEAN DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS matched_assessment_id BIGINT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS before_band TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS after_band TEXT;

CREATE INDEX IF NOT EXISTS idx_testimonials_segment_band ON public.testimonials(segment, band);


-- ============================================================
-- supabase\migrations\20260911120000_add_assessment_raw_score.sql
-- ============================================================
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS raw_score SMALLINT;


-- ============================================================
-- supabase\migrations\20260911130000_allow_passcode_assessment_submissions.sql
-- ============================================================
-- The readiness and execution forms are unlocked by the shared portal
-- passcode, then submitted directly from the browser. Keep all reads and
-- management restricted to admin users via the existing admin policies.
DROP POLICY IF EXISTS public_submit_readiness ON public.readiness;
CREATE POLICY public_submit_readiness ON public.readiness
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS public_submit_execution_forms ON public.execution_forms;
CREATE POLICY public_submit_execution_forms ON public.execution_forms
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);


-- ============================================================
-- supabase\migrations\20260923120000_add_tool_assessment_consent.sql
-- ============================================================
ALTER TABLE public.readiness
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

ALTER TABLE public.execution_forms
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;


-- ============================================================
-- supabase\migrations\20261008120000_secure_anon_form_submissions.sql
-- ============================================================
-- Keep row-level security active on every table written by the browser's
-- anonymous/public assessment flow. This does not grant read, update, or
-- delete access to anonymous visitors.
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.readiness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.execution_forms ENABLE ROW LEVEL SECURITY;

-- Existing policies expected from the prior migrations:
--   assessments:      public_submit_assessments, admin_manage_assessments
--   testimonials:     public_submit_testimonials, admin_manage_testimonials
--   readiness:        public_submit_readiness, admin_manage_readiness
--   execution_forms:  public_submit_execution_forms, admin_manage_execution_forms
-- Only the public INSERT policies conflict with the constrained replacements
-- below. The admin policies are intentionally preserved.
DROP POLICY IF EXISTS public_submit_assessments ON public.assessments;
DROP POLICY IF EXISTS public_submit_testimonials ON public.testimonials;
DROP POLICY IF EXISTS public_submit_readiness ON public.readiness;
DROP POLICY IF EXISTS public_submit_execution_forms ON public.execution_forms;

-- Permit a public Clarity submission only when it has the shape produced by
-- the form. The timestamp must be close to the database clock, while the
-- fixed consent version and permitted values stop callers from setting
-- server-managed fields arbitrarily.
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
    AND consent_version = '2026-09-05'
    AND created_at BETWEEN now() - INTERVAL '10 minutes' AND now() + INTERVAL '1 minute'
  );

-- Permit a testimonial submission, but reserve moderation and matching fields
-- for the application administrators.
CREATE POLICY public_submit_testimonials ON public.testimonials
  AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 100
    AND char_length(last_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 320
    AND (role IS NULL OR char_length(role) <= 200)
    AND anonymous IN ('Yes', 'No')
    AND (segment IS NULL OR segment IN ('Individual', 'Corporate', 'Federal'))
    AND (stage IS NULL OR stage IN ('Transitioner', 'Strategist', 'Executor', 'Phoenix'))
    AND (band IS NULL OR band IN ('Transitioner', 'Strategist', 'Executor', 'Phoenix'))
    AND band_source = 'self-reported'
    AND show_band IS NOT NULL
    AND matched_assessment_id IS NULL
    AND before_band IS NULL
    AND after_band IS NOT DISTINCT FROM band
    AND char_length(before) BETWEEN 1 AND 4000
    AND char_length(shift) BETWEEN 1 AND 4000
    AND char_length(after) BETWEEN 1 AND 4000
    AND status = 'Pending Review'
    AND created_at BETWEEN now() - INTERVAL '10 minutes' AND now() + INTERVAL '1 minute'
  );

-- Permit a passcode-gated Readiness submission. The shared passcode is a UI
-- gate only, so the database still treats this browser request as anonymous.
CREATE POLICY public_submit_readiness ON public.readiness
  AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 100
    AND char_length(last_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 320
    AND (company IS NULL OR char_length(company) <= 200)
    AND segment IN ('Individual', 'Corporate', 'Federal')
    AND score BETWEEN 0 AND 100
    AND jsonb_typeof(category_scores) = 'array'
    AND jsonb_array_length(category_scores) = 3
    AND band IN ('Guarded', 'Developing (25–49)', 'Willing', 'All In')
    AND gap IN ('The Uncertain Mirror', 'The Overloaded', 'The Hesitant Investor')
    AND jsonb_typeof(responses) = 'array'
    AND jsonb_array_length(responses) = 15
    AND session_type IN ('clarity-intensive', 'week1')
    AND (session_date IS NULL OR session_date BETWEEN DATE '2000-01-01' AND CURRENT_DATE + 1)
    AND consent_timestamp IS NOT NULL
    AND consent_version = '1.0'
    AND created_at BETWEEN now() - INTERVAL '10 minutes' AND now() + INTERVAL '1 minute'
  );

-- Permit an Execution submission, while fixing workflow fields that only the
-- coach console may change after the form is received.
CREATE POLICY public_submit_execution_forms ON public.execution_forms
  AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 100
    AND char_length(last_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 320
    AND (company IS NULL OR char_length(company) <= 200)
    AND segment IN ('Individual', 'Corporate', 'Federal')
    AND score BETWEEN 0 AND 100
    AND jsonb_typeof(category_scores) = 'array'
    AND jsonb_array_length(category_scores) = 3
    AND band IN ('Friction-Bound', 'Emergent Traction', 'Operational Cadence', 'Strategic Velocity')
    AND gap IN ('The Stop-Starter', 'The Autopilot', 'The Stall-Out')
    AND program_checkpoint IN ('Week 3', 'Week 6', 'Week 9', 'Week 12', 'Program Completion')
    AND jsonb_typeof(responses) = 'array'
    AND jsonb_array_length(responses) = 15
    AND status = 'Pending'
    AND notes IS NULL
    AND consent_timestamp IS NOT NULL
    AND consent_version = '1.0'
    AND created_at BETWEEN now() - INTERVAL '10 minutes' AND now() + INTERVAL '1 minute'
  );

-- Table privileges are separate from RLS. Give the anonymous browser role
-- INSERT on these four public-form tables and no new privileges of any other
-- kind. No anonymous SELECT, UPDATE, or DELETE policy is created above.
GRANT INSERT ON TABLE public.assessments, public.testimonials, public.readiness, public.execution_forms TO anon;


-- ============================================================
-- supabase\migrations\20261014120000_clarity_consent_notice_v2.sql
-- ============================================================
-- The Clarity intake now shows the full Participation & Data Use Notice
-- (Master Fix List, Appendix A) under consent version 2026-10-14. Accept that
-- version, and keep 2026-09-05 so browsers still holding the previous bundle
-- during a deploy are not rejected. Every other check is unchanged from
-- 20261008120000_secure_anon_form_submissions.sql.
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
    AND created_at BETWEEN now() - INTERVAL '10 minutes' AND now() + INTERVAL '1 minute'
  );


-- ============================================================
-- supabase\migrations\20261014130000_clarity_report_release.sql
-- ============================================================
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


-- ============================================================
-- Make your test coach login an admin (after creating the user under
-- Authentication -> Users). Replace the email, then run just this statement.
-- ============================================================
-- UPDATE auth.users SET raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb WHERE email = 'coach-test@example.com';
