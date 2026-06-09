CREATE OR REPLACE VIEW public.notice_rent_observations_trimmed AS
WITH base AS (
  SELECT
    COALESCE(county, public.infer_hu_county(concat_ws(' ', municipality, settlement)), 'Ismeretlen') AS county_name,
    *
  FROM public.notice_rent_observations
  WHERE rent_huf_per_ha_year IS NOT NULL
    AND rent_huf_per_ha_year BETWEEN 1000 AND 2000000
    AND confidence >= 0.5
),
limits AS (
  SELECT
    county_name,
    COUNT(*) AS raw_sample_count,
    percentile_cont(0.10) WITHIN GROUP (ORDER BY rent_huf_per_ha_year) AS p10,
    percentile_cont(0.90) WITHIN GROUP (ORDER BY rent_huf_per_ha_year) AS p90,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY rent_huf_per_ha_year) AS p25,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY rent_huf_per_ha_year) AS p75
  FROM base
  GROUP BY county_name
)
SELECT b.*
FROM base b
JOIN limits l USING (county_name)
WHERE
  CASE
    WHEN l.raw_sample_count >= 10 THEN b.rent_huf_per_ha_year BETWEEN l.p10 AND l.p90
    WHEN l.raw_sample_count >= 5 THEN b.rent_huf_per_ha_year BETWEEN (l.p25 - 1.5 * (l.p75 - l.p25)) AND (l.p75 + 1.5 * (l.p75 - l.p25))
    ELSE true
  END;

CREATE OR REPLACE VIEW public.notice_sale_price_observations_trimmed AS
WITH base AS (
  SELECT
    COALESCE(county, public.infer_hu_county(concat_ws(' ', municipality, settlement)), 'Ismeretlen') AS county_name,
    *
  FROM public.notice_sale_price_observations
  WHERE price_huf_per_ha IS NOT NULL
    AND price_huf_per_ha BETWEEN 10000 AND 50000000
    AND confidence >= 0.5
),
limits AS (
  SELECT
    county_name,
    COUNT(*) AS raw_sample_count,
    percentile_cont(0.10) WITHIN GROUP (ORDER BY price_huf_per_ha) AS p10,
    percentile_cont(0.90) WITHIN GROUP (ORDER BY price_huf_per_ha) AS p90,
    percentile_cont(0.25) WITHIN GROUP (ORDER BY price_huf_per_ha) AS p25,
    percentile_cont(0.75) WITHIN GROUP (ORDER BY price_huf_per_ha) AS p75
  FROM base
  GROUP BY county_name
)
SELECT b.*
FROM base b
JOIN limits l USING (county_name)
WHERE
  CASE
    WHEN l.raw_sample_count >= 10 THEN b.price_huf_per_ha BETWEEN l.p10 AND l.p90
    WHEN l.raw_sample_count >= 5 THEN b.price_huf_per_ha BETWEEN (l.p25 - 1.5 * (l.p75 - l.p25)) AND (l.p75 + 1.5 * (l.p75 - l.p25))
    ELSE true
  END;

CREATE OR REPLACE VIEW public.rent_observation_settlement_stats AS
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
FROM public.notice_rent_observations_trimmed
WHERE settlement_clean IS NOT NULL
GROUP BY settlement_clean;

CREATE OR REPLACE VIEW public.rent_observation_county_stats AS
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
FROM public.notice_rent_observations_trimmed
GROUP BY county_name;

CREATE OR REPLACE VIEW public.sale_price_county_stats AS
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
FROM public.notice_sale_price_observations_trimmed
GROUP BY county_name;

ALTER VIEW public.notice_rent_observations_trimmed SET (security_invoker = true);
ALTER VIEW public.notice_sale_price_observations_trimmed SET (security_invoker = true);
ALTER VIEW public.rent_observation_settlement_stats SET (security_invoker = true);
ALTER VIEW public.rent_observation_county_stats SET (security_invoker = true);
ALTER VIEW public.sale_price_county_stats SET (security_invoker = true);

GRANT SELECT ON public.notice_rent_observations_trimmed TO anon, authenticated;
GRANT SELECT ON public.notice_sale_price_observations_trimmed TO anon, authenticated;
GRANT SELECT ON public.rent_observation_settlement_stats TO anon, authenticated;
GRANT SELECT ON public.rent_observation_county_stats TO anon, authenticated;
GRANT SELECT ON public.sale_price_county_stats TO anon, authenticated;
