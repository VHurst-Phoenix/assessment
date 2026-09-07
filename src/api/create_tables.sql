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
  before TEXT,
  shift TEXT,
  after TEXT,
  status TEXT DEFAULT 'Pending Review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS email TEXT;

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

-- Recreate the application policies every time this migration runs. The former
-- "IF NOT EXISTS" approach left old policy definitions in place, which can
-- continue rejecting inserts even after this file is updated.
DROP POLICY IF EXISTS public_submit_assessments ON public.assessments;
DROP POLICY IF EXISTS admin_manage_assessments ON public.assessments;
DROP POLICY IF EXISTS public_submit_testimonials ON public.testimonials;
DROP POLICY IF EXISTS admin_manage_testimonials ON public.testimonials;
DROP POLICY IF EXISTS admin_manage_readiness ON public.readiness;
DROP POLICY IF EXISTS admin_manage_execution_forms ON public.execution_forms;

-- Public forms need INSERT only. Neither the anon key nor a regular signed-in
-- participant can read, modify, or delete submitted client data.
CREATE POLICY public_submit_assessments ON public.assessments
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY public_submit_testimonials ON public.testimonials
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
