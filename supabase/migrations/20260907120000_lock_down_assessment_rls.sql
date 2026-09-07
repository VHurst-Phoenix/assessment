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
