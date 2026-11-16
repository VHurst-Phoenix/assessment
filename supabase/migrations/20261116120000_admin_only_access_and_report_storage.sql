-- Live fix, 2026-11-16. Safe to run more than once.
--
-- 1. Restrict reading/editing to admins. The live project had
--    authenticated_manage_* policies with USING (true), so ANY signed-in
--    account could read, edit and delete every record. Admin is
--    app_metadata.role = 'admin' (set server-side only).
-- 2. Add the Complete Clarity Report columns and private storage bucket
--    (from 20261014130000, which was never applied to the live project).
--
-- Public INSERT policies are left unchanged here; tighten them after the
-- 20261008120000 rules have been tested on staging.
-- No rows are changed or deleted.

BEGIN;

-- 1. Admin-only management -------------------------------------------------
DROP POLICY IF EXISTS authenticated_manage_assessments ON public.assessments;
DROP POLICY IF EXISTS authenticated_manage_testimonials ON public.testimonials;
DROP POLICY IF EXISTS authenticated_manage_readiness ON public.readiness;
DROP POLICY IF EXISTS authenticated_manage_execution_forms ON public.execution_forms;

DROP POLICY IF EXISTS admin_manage_assessments ON public.assessments;
DROP POLICY IF EXISTS admin_manage_testimonials ON public.testimonials;
DROP POLICY IF EXISTS admin_manage_readiness ON public.readiness;
DROP POLICY IF EXISTS admin_manage_execution_forms ON public.execution_forms;

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

-- 2. Complete Clarity Report storage ---------------------------------------
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS report_pdf_path text,
  ADD COLUMN IF NOT EXISTS report_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_released_at timestamptz;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('clarity-reports', 'clarity-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS admin_manage_clarity_reports ON storage.objects;

CREATE POLICY admin_manage_clarity_reports ON storage.objects
  AS PERMISSIVE FOR ALL TO authenticated
  USING (bucket_id = 'clarity-reports' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK (bucket_id = 'clarity-reports' AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

COMMIT;
