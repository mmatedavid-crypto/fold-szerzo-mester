CREATE TABLE IF NOT EXISTS public.notice_rent_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notice_id UUID REFERENCES public.notices(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'hirdetmenyek.gov.hu',
  source_notice_id TEXT,
  settlement TEXT,
  settlement_clean TEXT,
  county TEXT,
  municipality TEXT,
  lat NUMERIC,
  lng NUMERIC,
  publication_date DATE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  area_ha NUMERIC,
  cultivation_branch TEXT,
  rent_raw TEXT,
  rent_total_huf_year NUMERIC,
  rent_huf_per_ha_year NUMERIC,
  rent_huf_per_ak_year NUMERIC,
  rent_unit TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.6,
  extraction_method TEXT NOT NULL DEFAULT 'notice_import',
  source_attachment_url TEXT,
  raw_text_excerpt TEXT,
  parse_version TEXT NOT NULL DEFAULT 'rent-normalizer-2026-06-08',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notice_rent_observations_confidence_check CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT notice_rent_observations_positive_price_check CHECK (
    rent_huf_per_ha_year IS NULL OR rent_huf_per_ha_year > 0
  )
);

GRANT SELECT ON public.notice_rent_observations TO anon, authenticated;
GRANT ALL ON public.notice_rent_observations TO service_role;

ALTER TABLE public.notice_rent_observations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notice_rent_observations' AND policyname='Rent observations public read') THEN
    CREATE POLICY "Rent observations public read"
      ON public.notice_rent_observations FOR SELECT USING (true);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS notice_rent_observations_notice_method_unique
  ON public.notice_rent_observations (notice_id, extraction_method)
  WHERE notice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notice_rent_observations_settlement_idx
  ON public.notice_rent_observations (settlement_clean);

CREATE INDEX IF NOT EXISTS notice_rent_observations_publication_idx
  ON public.notice_rent_observations (publication_date);

CREATE INDEX IF NOT EXISTS notice_rent_observations_price_idx
  ON public.notice_rent_observations (rent_huf_per_ha_year)
  WHERE rent_huf_per_ha_year IS NOT NULL;

CREATE OR REPLACE FUNCTION public.clean_hu_settlement_name(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT NULLIF(
    btrim(
      regexp_replace(
        regexp_replace(
          regexp_replace(coalesce(input, ''), '^(adás-vétel|haszonbérlet|haszonberlet|vétel|vetel)\s*-\s*', '', 'i'),
          '\s+hrsz\.?.*$', '', 'i'
        ),
        '\s+', ' ', 'g'
      )
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.touch_notice_rent_observations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notice_rent_observations_updated_at ON public.notice_rent_observations;
CREATE TRIGGER notice_rent_observations_updated_at
  BEFORE UPDATE ON public.notice_rent_observations
  FOR EACH ROW EXECUTE FUNCTION public.touch_notice_rent_observations_updated_at();

CREATE OR REPLACE FUNCTION public.upsert_notice_rent_observation_from_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.rent_normalized_huf_per_ha_year IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notice_rent_observations (
    notice_id, source, source_notice_id, settlement, settlement_clean,
    county, municipality, publication_date, area_ha, cultivation_branch,
    rent_raw, rent_huf_per_ha_year, rent_unit, confidence, extraction_method,
    source_attachment_url, raw_text_excerpt
  ) VALUES (
    NEW.id, NEW.source, NEW.source_notice_id, NEW.settlement,
    public.clean_hu_settlement_name(NEW.settlement),
    NEW.county, NEW.municipality, NEW.publication_date, NEW.area_ha, NEW.cultivation_branch,
    NEW.rent_raw, NEW.rent_normalized_huf_per_ha_year, COALESCE(NEW.rent_unit, 'Ft/ha/év'),
    0.72, 'notice_import', NEW.original_attachment_url, LEFT(NEW.rent_raw, 500)
  )
  ON CONFLICT (notice_id, extraction_method) WHERE notice_id IS NOT NULL
  DO UPDATE SET
    source = EXCLUDED.source,
    source_notice_id = EXCLUDED.source_notice_id,
    settlement = EXCLUDED.settlement,
    settlement_clean = EXCLUDED.settlement_clean,
    county = EXCLUDED.county,
    municipality = EXCLUDED.municipality,
    publication_date = EXCLUDED.publication_date,
    area_ha = EXCLUDED.area_ha,
    cultivation_branch = EXCLUDED.cultivation_branch,
    rent_raw = EXCLUDED.rent_raw,
    rent_huf_per_ha_year = EXCLUDED.rent_huf_per_ha_year,
    rent_unit = EXCLUDED.rent_unit,
    confidence = EXCLUDED.confidence,
    source_attachment_url = EXCLUDED.source_attachment_url,
    raw_text_excerpt = EXCLUDED.raw_text_excerpt,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notices_rent_observation_upsert ON public.notices;
CREATE TRIGGER notices_rent_observation_upsert
  AFTER INSERT OR UPDATE OF rent_normalized_huf_per_ha_year, rent_raw, area_ha, settlement, publication_date
  ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.upsert_notice_rent_observation_from_notice();

INSERT INTO public.notice_rent_observations (
  notice_id, source, source_notice_id, settlement, settlement_clean,
  county, municipality, publication_date, area_ha, cultivation_branch,
  rent_raw, rent_huf_per_ha_year, rent_unit, confidence, extraction_method,
  source_attachment_url, raw_text_excerpt
)
SELECT
  n.id, n.source, n.source_notice_id, n.settlement,
  public.clean_hu_settlement_name(n.settlement),
  n.county, n.municipality, n.publication_date, n.area_ha, n.cultivation_branch,
  n.rent_raw, n.rent_normalized_huf_per_ha_year, COALESCE(n.rent_unit, 'Ft/ha/év'),
  0.72, 'notice_import', n.original_attachment_url, LEFT(n.rent_raw, 500)
FROM public.notices n
WHERE n.rent_normalized_huf_per_ha_year IS NOT NULL
ON CONFLICT (notice_id, extraction_method) WHERE notice_id IS NOT NULL DO NOTHING;

CREATE OR REPLACE VIEW public.rent_observation_settlement_stats AS
WITH usable AS (
  SELECT *
  FROM public.notice_rent_observations
  WHERE rent_huf_per_ha_year IS NOT NULL
    AND rent_huf_per_ha_year BETWEEN 1000 AND 2000000
    AND confidence >= 0.5
    AND settlement_clean IS NOT NULL
)
SELECT
  settlement_clean,
  MIN(settlement) AS settlement_label,
  MIN(county) AS county,
  MIN(municipality) AS municipality,
  MIN(lat) AS lat,
  MIN(lng) AS lng,
  COUNT(*)::INTEGER AS sample_count,
  ROUND(AVG(rent_huf_per_ha_year))::INTEGER AS avg_huf_per_ha_year,
  percentile_disc(0.5) WITHIN GROUP (ORDER BY rent_huf_per_ha_year)::INTEGER AS median_huf_per_ha_year,
  percentile_disc(0.25) WITHIN GROUP (ORDER BY rent_huf_per_ha_year)::INTEGER AS p25_huf_per_ha_year,
  percentile_disc(0.75) WITHIN GROUP (ORDER BY rent_huf_per_ha_year)::INTEGER AS p75_huf_per_ha_year,
  MIN(rent_huf_per_ha_year)::INTEGER AS min_huf_per_ha_year,
  MAX(rent_huf_per_ha_year)::INTEGER AS max_huf_per_ha_year,
  MAX(publication_date) AS latest_publication_date,
  MAX(observed_at) AS latest_observed_at
FROM usable
GROUP BY settlement_clean;

GRANT SELECT ON public.rent_observation_settlement_stats TO anon, authenticated;

ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS source_case_number TEXT,
  ADD COLUMN IF NOT EXISTS registry_number TEXT,
  ADD COLUMN IF NOT EXISTS source_notice_type TEXT,
  ADD COLUMN IF NOT EXISTS normalized_notice_category TEXT,
  ADD COLUMN IF NOT EXISTS source_deadline_date DATE;

CREATE INDEX IF NOT EXISTS notices_normalized_category_idx ON public.notices (normalized_notice_category);
CREATE INDEX IF NOT EXISTS notices_source_case_idx ON public.notices (source_case_number);
CREATE INDEX IF NOT EXISTS notices_registry_number_idx ON public.notices (registry_number);

CREATE OR REPLACE FUNCTION public.classify_hirdetmeny_category(source_type TEXT, subject TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
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