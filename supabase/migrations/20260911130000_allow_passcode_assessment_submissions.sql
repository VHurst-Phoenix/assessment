-- The readiness and execution forms are unlocked by the shared portal
-- passcode, then submitted directly from the browser. Keep all reads and
-- management restricted to admin users via the existing admin policies.
DROP POLICY IF EXISTS public_submit_readiness ON public.readiness;
CREATE POLICY public_submit_readiness ON public.readiness
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS public_submit_execution_forms ON public.execution_forms;
CREATE POLICY public_submit_execution_forms ON public.execution_forms
  AS PERMISSIVE FOR INSERT TO anon, authenticated WITH CHECK (true);
