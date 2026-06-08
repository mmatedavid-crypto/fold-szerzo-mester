ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS source_case_number TEXT,
  ADD COLUMN IF NOT EXISTS registry_number TEXT,
  ADD COLUMN IF NOT EXISTS source_notice_type TEXT,
  ADD COLUMN IF NOT EXISTS normalized_notice_category TEXT,
  ADD COLUMN IF NOT EXISTS source_deadline_date DATE;

CREATE INDEX IF NOT EXISTS notices_normalized_category_idx
  ON public.notices (normalized_notice_category);

CREATE INDEX IF NOT EXISTS notices_source_case_idx
  ON public.notices (source_case_number);

CREATE INDEX IF NOT EXISTS notices_registry_number_idx
  ON public.notices (registry_number);

CREATE OR REPLACE FUNCTION public.classify_hirdetmeny_category(source_type TEXT, subject TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN coalesce(subject, '') ~* '(haszonb[ée]r|b[ée]rleti|földhaszonb[ée]r|foldhaszonber)' THEN 'haszonberlet'
    WHEN coalesce(subject, '') ~* '(adás-vétel|adas-vetel|elővásárl|elovasarl)' THEN 'adasvetel'
    WHEN coalesce(source_type, '') = 'foldelovasarlasos' THEN 'adasvetel'
    WHEN coalesce(source_type, '') = 'foldhivatali' THEN 'foldhivatali'
    ELSE lower(nullif(coalesce(source_type, ''), ''))
  END;
$$;

UPDATE public.notices
SET
  source_notice_type = COALESCE(source_notice_type, raw_json->>'hirdetmenyTipusNev'),
  source_case_number = COALESCE(source_case_number, raw_json->>'ugyiratszam'),
  registry_number = COALESCE(registry_number, raw_json->>'iktatasiszam'),
  normalized_notice_category = COALESCE(
    normalized_notice_category,
    public.classify_hirdetmeny_category(raw_json->>'hirdetmenyTipusNev', subject)
  )
WHERE raw_json IS NOT NULL
   OR normalized_notice_category IS NULL;
