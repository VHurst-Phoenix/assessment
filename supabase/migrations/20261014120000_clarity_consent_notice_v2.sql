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
