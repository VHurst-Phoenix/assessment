ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS segment TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS band TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS band_source TEXT DEFAULT 'self-reported';
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS show_band BOOLEAN DEFAULT true;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS matched_assessment_id BIGINT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS before_band TEXT;
ALTER TABLE public.testimonials ADD COLUMN IF NOT EXISTS after_band TEXT;

CREATE INDEX IF NOT EXISTS idx_testimonials_segment_band ON public.testimonials(segment, band);
