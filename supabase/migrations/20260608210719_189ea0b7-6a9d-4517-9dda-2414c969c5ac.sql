ALTER TABLE public.notices
  ADD COLUMN IF NOT EXISTS price_total_huf NUMERIC,
  ADD COLUMN IF NOT EXISTS price_normalized_huf_per_ha NUMERIC;

CREATE OR REPLACE FUNCTION public.infer_hu_county(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN coalesce(input, '') ~* 'bács|bacs' THEN 'Bács-Kiskun'
    WHEN coalesce(input, '') ~* 'baranya' THEN 'Baranya'
    WHEN coalesce(input, '') ~* 'békés|bekes' THEN 'Békés'
    WHEN coalesce(input, '') ~* 'borsod|abaúj|abauj|zemplén|zemplen' THEN 'Borsod-Abaúj-Zemplén'
    WHEN coalesce(input, '') ~* 'csongrád|csongrad|csanád|csanad' THEN 'Csongrád-Csanád'
    WHEN coalesce(input, '') ~* 'fejér|fejer' THEN 'Fejér'
    WHEN coalesce(input, '') ~* 'győr|gyor|moson|sopron' THEN 'Győr-Moson-Sopron'
    WHEN coalesce(input, '') ~* 'hajdú|hajdu|bihar' THEN 'Hajdú-Bihar'
    WHEN coalesce(input, '') ~* 'heves' THEN 'Heves'
    WHEN coalesce(input, '') ~* 'jász|jasz|nagykun|szolnok' THEN 'Jász-Nagykun-Szolnok'
    WHEN coalesce(input, '') ~* 'komárom|komarom|esztergom' THEN 'Komárom-Esztergom'
    WHEN coalesce(input, '') ~* 'nógrád|nograd' THEN 'Nógrád'
    WHEN coalesce(input, '') ~* 'pest|budapest|főváros|fovaros' THEN 'Pest'
    WHEN coalesce(input, '') ~* 'somogy' THEN 'Somogy'
    WHEN coalesce(input, '') ~* 'szabolcs|szatmár|szatmar|bereg' THEN 'Szabolcs-Szatmár-Bereg'
    WHEN coalesce(input, '') ~* 'tolna' THEN 'Tolna'
    WHEN coalesce(input, '') ~* 'vas' THEN 'Vas'
    WHEN coalesce(input, '') ~* 'veszprém|veszprem' THEN 'Veszprém'
    WHEN coalesce(input, '') ~* 'zala' THEN 'Zala'
    ELSE NULL
  END;
$$;

CREATE TABLE IF NOT EXISTS public.notice_sale_price_observations (
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
  price_raw TEXT,
  price_total_huf NUMERIC,
  price_huf_per_ha NUMERIC,
  price_unit TEXT,
  confidence NUMERIC NOT NULL DEFAULT 0.6,
  extraction_method TEXT NOT NULL DEFAULT 'notice_import',
  source_attachment_url TEXT,
  raw_text_excerpt TEXT,
  parse_version TEXT NOT NULL DEFAULT 'sale-price-normalizer-2026-06-08',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT notice_sale_price_observations_confidence_check CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT notice_sale_price_observations_positive_price_check CHECK (
    price_huf_per_ha IS NULL OR price_huf_per_ha > 0
  )
);

GRANT SELECT ON public.notice_sale_price_observations TO anon, authenticated;
GRANT ALL ON public.notice_sale_price_observations TO service_role;

ALTER TABLE public.notice_sale_price_observations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='notice_sale_price_observations' AND policyname='Sale price observations public read') THEN
    CREATE POLICY "Sale price observations public read"
      ON public.notice_sale_price_observations FOR SELECT USING (true);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS notice_sale_price_observations_notice_method_unique
  ON public.notice_sale_price_observations (notice_id, extraction_method)
  WHERE notice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notice_sale_price_observations_county_idx
  ON public.notice_sale_price_observations (county);
CREATE INDEX IF NOT EXISTS notice_sale_price_observations_settlement_idx
  ON public.notice_sale_price_observations (settlement_clean);
CREATE INDEX IF NOT EXISTS notice_sale_price_observations_publication_idx
  ON public.notice_sale_price_observations (publication_date);
CREATE INDEX IF NOT EXISTS notice_sale_price_observations_price_idx
  ON public.notice_sale_price_observations (price_huf_per_ha)
  WHERE price_huf_per_ha IS NOT NULL;

CREATE OR REPLACE FUNCTION public.touch_notice_sale_price_observations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS notice_sale_price_observations_updated_at ON public.notice_sale_price_observations;
CREATE TRIGGER notice_sale_price_observations_updated_at
  BEFORE UPDATE ON public.notice_sale_price_observations
  FOR EACH ROW EXECUTE FUNCTION public.touch_notice_sale_price_observations_updated_at();

CREATE OR REPLACE FUNCTION public.upsert_notice_sale_price_observation_from_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price_normalized_huf_per_ha IS NULL THEN RETURN NEW; END IF;

  INSERT INTO public.notice_sale_price_observations (
    notice_id, source, source_notice_id, settlement, settlement_clean,
    county, municipality, publication_date, area_ha, cultivation_branch,
    price_raw, price_total_huf, price_huf_per_ha, price_unit, confidence,
    extraction_method, source_attachment_url, raw_text_excerpt
  ) VALUES (
    NEW.id, NEW.source, NEW.source_notice_id, NEW.settlement,
    public.clean_hu_settlement_name(NEW.settlement),
    COALESCE(NEW.county, public.infer_hu_county(concat_ws(' ', NEW.municipality, NEW.settlement))),
    NEW.municipality, NEW.publication_date, NEW.area_ha, NEW.cultivation_branch,
    NEW.price_raw, NEW.price_total_huf, NEW.price_normalized_huf_per_ha, 'Ft/ha',
    0.72, 'notice_import', NEW.original_attachment_url, LEFT(NEW.price_raw, 500)
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
    price_raw = EXCLUDED.price_raw,
    price_total_huf = EXCLUDED.price_total_huf,
    price_huf_per_ha = EXCLUDED.price_huf_per_ha,
    price_unit = EXCLUDED.price_unit,
    confidence = EXCLUDED.confidence,
    source_attachment_url = EXCLUDED.source_attachment_url,
    raw_text_excerpt = EXCLUDED.raw_text_excerpt,
    updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notices_sale_price_observation_upsert ON public.notices;
CREATE TRIGGER notices_sale_price_observation_upsert
  AFTER INSERT OR UPDATE OF price_normalized_huf_per_ha, price_raw, price_total_huf, area_ha, settlement, publication_date
  ON public.notices
  FOR EACH ROW EXECUTE FUNCTION public.upsert_notice_sale_price_observation_from_notice();

UPDATE public.notice_rent_observations
SET county = public.infer_hu_county(concat_ws(' ', municipality, settlement))
WHERE county IS NULL;

CREATE OR REPLACE VIEW public.rent_observation_county_stats AS
WITH usable AS (
  SELECT
    COALESCE(county, public.infer_hu_county(concat_ws(' ', municipality, settlement)), 'Ismeretlen') AS county_name,
    *
  FROM public.notice_rent_observations
  WHERE rent_huf_per_ha_year IS NOT NULL
    AND rent_huf_per_ha_year BETWEEN 1000 AND 2000000
    AND confidence >= 0.5
)
SELECT
  county_name,
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
GROUP BY county_name;

CREATE OR REPLACE VIEW public.sale_price_county_stats AS
WITH usable AS (
  SELECT
    COALESCE(county, public.infer_hu_county(concat_ws(' ', municipality, settlement)), 'Ismeretlen') AS county_name,
    *
  FROM public.notice_sale_price_observations
  WHERE price_huf_per_ha IS NOT NULL
    AND price_huf_per_ha BETWEEN 10000 AND 50000000
    AND confidence >= 0.5
)
SELECT
  county_name,
  COUNT(*)::INTEGER AS sample_count,
  ROUND(AVG(price_huf_per_ha))::INTEGER AS avg_huf_per_ha,
  percentile_disc(0.5) WITHIN GROUP (ORDER BY price_huf_per_ha)::INTEGER AS median_huf_per_ha,
  percentile_disc(0.25) WITHIN GROUP (ORDER BY price_huf_per_ha)::INTEGER AS p25_huf_per_ha,
  percentile_disc(0.75) WITHIN GROUP (ORDER BY price_huf_per_ha)::INTEGER AS p75_huf_per_ha,
  MIN(price_huf_per_ha)::INTEGER AS min_huf_per_ha,
  MAX(price_huf_per_ha)::INTEGER AS max_huf_per_ha,
  MAX(publication_date) AS latest_publication_date,
  MAX(observed_at) AS latest_observed_at
FROM usable
GROUP BY county_name;

ALTER VIEW public.rent_observation_county_stats SET (security_invoker = true);
ALTER VIEW public.sale_price_county_stats SET (security_invoker = true);

GRANT SELECT ON public.rent_observation_county_stats TO anon, authenticated;
GRANT SELECT ON public.sale_price_county_stats TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.touch_notice_sale_price_observations_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.upsert_notice_sale_price_observation_from_notice() FROM PUBLIC, anon, authenticated;