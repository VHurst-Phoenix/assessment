-- Create assessment table
CREATE TABLE IF NOT EXISTS public.assessments (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL,
  identity TEXT,
  source TEXT,
  context TEXT,
  responses JSONB,
  score INTEGER,
  archetype TEXT,
  dim_scores JSONB,          -- [clarity, confidence, action, alignment, readiness] raw scores (0–25 each)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- If the table already exists, add the column with:
-- ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS dim_scores JSONB;

CREATE INDEX IF NOT EXISTS idx_assessments_email ON public.assessments(email);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON public.assessments(created_at);

-- Create testimonials table
CREATE TABLE IF NOT EXISTS public.testimonials (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT,
  last_name TEXT,
  anonymous TEXT DEFAULT 'No',
  role TEXT,
  stage TEXT,
  before TEXT,
  shift TEXT,
  after TEXT,
  status TEXT DEFAULT 'Pending Review',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_testimonials_status ON public.testimonials(status);
CREATE INDEX IF NOT EXISTS idx_testimonials_created_at ON public.testimonials(created_at);

-- Create readiness table
CREATE TABLE IF NOT EXISTS public.readiness (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  score INTEGER,
  responses JSONB,           -- full array of coach rating answers
  session_type TEXT,         -- e.g. 'clarity-intensive' | 'week1'
  session_date DATE,         -- date of the session being evaluated
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- If the table already exists, add the columns with:
-- ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS responses JSONB;
-- ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS session_type TEXT;
-- ALTER TABLE public.readiness ADD COLUMN IF NOT EXISTS session_date DATE;

CREATE INDEX IF NOT EXISTS idx_readiness_email ON public.readiness(email);
CREATE INDEX IF NOT EXISTS idx_readiness_created_at ON public.readiness(created_at);

-- Create execution forms table
CREATE TABLE IF NOT EXISTS public.execution_forms (
  id BIGSERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  responses JSONB,
  status TEXT DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_execution_forms_email ON public.execution_forms(email);
CREATE INDEX IF NOT EXISTS idx_execution_forms_status ON public.execution_forms(status);
CREATE INDEX IF NOT EXISTS idx_execution_forms_created_at ON public.execution_forms(created_at);
