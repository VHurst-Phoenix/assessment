ALTER TABLE public.readiness
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;

ALTER TABLE public.execution_forms
  ADD COLUMN IF NOT EXISTS consent_timestamp TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS consent_version TEXT;
