-- Share Your Story form, build request v1.2 (approved 2026-11-13).
-- Run in the live SQL editor BEFORE merging the matching front-end change:
-- the new form writes these columns and the old form cannot satisfy the new
-- insert rule. Safe to run more than once. No existing rows are changed.
--
-- P1/M15  consent to publish: timestamp + notice version, required on insert
-- P2/M8   one-sentence quote
-- P3/M10-M12  name display, permitted uses, editing choice
-- M5      engagement type (internal); "assessment only" = feedback
-- M6      self-reported Band "when you started" / "now"
-- M14     story-call request
-- V1      Band matched by email on the server at insert (trigger)
-- V2      at most 3 submissions per email per 24 hours (trigger)
-- V3      Removal Requested / Removed statuses, each status with a timestamp
-- P3      public stories read through a function that returns only the
--         fields the public card may show (no email, segment, engagement)

BEGIN;

-- Columns ------------------------------------------------------------------
ALTER TABLE public.testimonials
  ADD COLUMN IF NOT EXISTS quote text,
  ADD COLUMN IF NOT EXISTS engagement_type text,
  ADD COLUMN IF NOT EXISTS name_display text,
  ADD COLUMN IF NOT EXISTS permitted_uses text[],
  ADD COLUMN IF NOT EXISTS edit_choice text,
  ADD COLUMN IF NOT EXISTS story_call_request boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS self_band_start text,
  ADD COLUMN IF NOT EXISTS self_band_now text,
  ADD COLUMN IF NOT EXISTS consent_timestamp timestamptz,
  ADD COLUMN IF NOT EXISTS consent_version text,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS rejected_at timestamptz,
  ADD COLUMN IF NOT EXISTS removal_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz;

-- Server-managed fields on insert: email match (V1), rate limit (V2) -------
CREATE OR REPLACE FUNCTION public.testimonial_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recent_count integer;
  match_count integer;
  first_key text;
  latest_key text;
  latest_id bigint;
BEGIN
  NEW.email := lower(trim(NEW.email));

  SELECT count(*) INTO recent_count
  FROM public.testimonials
  WHERE email = NEW.email AND created_at > now() - interval '24 hours';
  IF recent_count >= 3 THEN
    RAISE EXCEPTION 'You have already shared several stories today. Please try again tomorrow.'
      USING ERRCODE = 'P0001';
  END IF;

  -- Never trust these from the browser.
  NEW.status := 'Pending Review';
  NEW.created_at := now();
  NEW.status_changed_at := NULL;
  NEW.approved_at := NULL;
  NEW.rejected_at := NULL;
  NEW.removal_requested_at := NULL;
  NEW.removed_at := NULL;
  NEW.anonymous := CASE WHEN NEW.name_display = 'anonymous' THEN 'Yes' ELSE 'No' END;

  SELECT count(*) INTO match_count
  FROM public.assessments
  WHERE lower(email) = NEW.email
    AND archetype IN ('transitioner', 'strategist', 'executor', 'phoenix');

  IF match_count > 0 THEN
    SELECT archetype INTO first_key FROM public.assessments
    WHERE lower(email) = NEW.email AND archetype IN ('transitioner', 'strategist', 'executor', 'phoenix')
    ORDER BY created_at ASC LIMIT 1;

    SELECT id, archetype INTO latest_id, latest_key FROM public.assessments
    WHERE lower(email) = NEW.email AND archetype IN ('transitioner', 'strategist', 'executor', 'phoenix')
    ORDER BY created_at DESC LIMIT 1;

    NEW.band := initcap(latest_key);
    NEW.band_source := 'verified';
    NEW.matched_assessment_id := latest_id;
    NEW.after_band := initcap(latest_key);
    -- Band movement only when both points are verified (2+ Clarity records).
    NEW.before_band := CASE WHEN match_count >= 2 THEN initcap(first_key) END;
  ELSE
    NEW.band := CASE WHEN NEW.self_band_now IN ('Transitioner', 'Strategist', 'Executor', 'Phoenix') THEN NEW.self_band_now END;
    NEW.band_source := 'self-reported';
    NEW.matched_assessment_id := NULL;
    NEW.before_band := NULL;
    NEW.after_band := NULL;
  END IF;
  NEW.stage := NEW.band;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS testimonial_before_insert ON public.testimonials;
CREATE TRIGGER testimonial_before_insert
  BEFORE INSERT ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.testimonial_before_insert();

-- Status timestamps (V3) ----------------------------------------------------
CREATE OR REPLACE FUNCTION public.testimonial_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();
    CASE NEW.status
      WHEN 'Approved' THEN NEW.approved_at := now();
      WHEN 'Rejected' THEN NEW.rejected_at := now();
      WHEN 'Removal Requested' THEN NEW.removal_requested_at := now();
      WHEN 'Removed' THEN NEW.removed_at := now();
      ELSE NULL;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS testimonial_status_timestamps ON public.testimonials;
CREATE TRIGGER testimonial_status_timestamps
  BEFORE UPDATE ON public.testimonials
  FOR EACH ROW EXECUTE FUNCTION public.testimonial_status_timestamps();

-- Public submission rule: consent v3 required (P1), approved option values.
-- Band, status and timestamps are set by the trigger above, not checked here.
DROP POLICY IF EXISTS public_submit_testimonials ON public.testimonials;

CREATE POLICY public_submit_testimonials ON public.testimonials
  AS PERMISSIVE FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(first_name) BETWEEN 1 AND 100
    AND char_length(last_name) BETWEEN 1 AND 100
    AND char_length(email) BETWEEN 3 AND 320
    AND (role IS NULL OR char_length(role) <= 200)
    AND (segment IS NULL OR segment IN ('Individual', 'Corporate', 'Federal'))
    AND engagement_type IN ('clarity_intensive', 'coaching_package', 'pq_program', 'assessment_only', 'other')
    AND name_display IN ('anonymous', 'first_last_initial', 'full_name')
    AND edit_choice IN ('exact', 'shorten_with_approval')
    AND permitted_uses IS NOT NULL
    AND permitted_uses <@ ARRAY['client_stories', 'social_media', 'sales_materials', 'case_study', 'speaking']::text[]
    AND (self_band_start IS NULL OR self_band_start IN ('Transitioner', 'Strategist', 'Executor', 'Phoenix', 'Not sure'))
    AND (self_band_now IS NULL OR self_band_now IN ('Transitioner', 'Strategist', 'Executor', 'Phoenix', 'Not sure'))
    AND show_band IS NOT NULL
    AND story_call_request IS NOT NULL
    AND char_length(before) BETWEEN 1 AND 4000
    AND char_length(shift) BETWEEN 1 AND 4000
    AND char_length(after) BETWEEN 1 AND 4000
    AND char_length(quote) BETWEEN 1 AND 300
    AND consent_timestamp IS NOT NULL
    AND consent_version = 'Consent v3, 2026-11'
  );

-- Public stories (P3): only what the public card may show ------------------
-- Approved, consented stories cleared for the requested placement. Stories
-- without consent on file (all submitted before this build) never appear.
-- "Assessment only" submissions are feedback, not coaching testimonials.
CREATE OR REPLACE FUNCTION public.get_published_stories(placement text DEFAULT 'client_stories')
RETURNS TABLE (
  id bigint,
  display_name text,
  role text,
  before text,
  shift text,
  after text,
  quote text,
  band text,
  approved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    t.id,
    CASE t.name_display
      WHEN 'full_name' THEN trim(t.first_name || ' ' || t.last_name)
      WHEN 'first_last_initial' THEN trim(t.first_name || ' ' || left(t.last_name, 1) || '.')
      ELSE 'Anonymous client'
    END,
    t.role,
    t.before,
    t.shift,
    t.after,
    t.quote,
    CASE WHEN t.show_band THEN t.band END,
    t.approved_at
  FROM public.testimonials t
  WHERE t.status = 'Approved'
    AND t.consent_timestamp IS NOT NULL
    AND placement = ANY (t.permitted_uses)
    AND t.engagement_type IS DISTINCT FROM 'assessment_only'
  ORDER BY t.approved_at DESC NULLS LAST, t.created_at DESC;
$$;

REVOKE ALL ON FUNCTION public.get_published_stories(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_published_stories(text) TO anon, authenticated;

COMMIT;
