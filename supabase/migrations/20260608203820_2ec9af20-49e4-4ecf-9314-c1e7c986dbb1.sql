ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS source_deadline_date date,
  ADD COLUMN IF NOT EXISTS source_case_number text,
  ADD COLUMN IF NOT EXISTS registry_number text,
  ADD COLUMN IF NOT EXISTS source_notice_type text,
  ADD COLUMN IF NOT EXISTS normalized_notice_category text;

CREATE INDEX IF NOT EXISTS notices_normalized_category_idx
  ON public.notices (normalized_notice_category);