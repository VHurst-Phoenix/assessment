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
