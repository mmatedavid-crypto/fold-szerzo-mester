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
    notice_id,
    source,
    source_notice_id,
    settlement,
    settlement_clean,
    county,
    municipality,
    publication_date,
    area_ha,
    cultivation_branch,
    rent_raw,
    rent_total_huf_year,
    rent_huf_per_ha_year,
    rent_unit,
    confidence,
    extraction_method,
    source_attachment_url,
    raw_text_excerpt
  )
  VALUES (
    NEW.id,
    NEW.source,
    NEW.source_notice_id,
    NEW.settlement,
    public.clean_hu_settlement_name(NEW.settlement),
    COALESCE(NEW.county, public.infer_hu_county(concat_ws(' ', NEW.municipality, NEW.settlement))),
    NEW.municipality,
    NEW.publication_date,
    NEW.area_ha,
    NEW.cultivation_branch,
    NEW.rent_raw,
    CASE
      WHEN NEW.rent_normalized_huf_per_ha_year IS NOT NULL AND NEW.area_ha IS NOT NULL
        THEN ROUND(NEW.rent_normalized_huf_per_ha_year * NEW.area_ha)
      ELSE NULL
    END,
    NEW.rent_normalized_huf_per_ha_year,
    COALESCE(NEW.rent_unit, 'Ft/ha/év'),
    0.72,
    'notice_import',
    COALESCE(NEW.original_attachment_url, NEW.original_detail_url),
    LEFT(NEW.rent_raw, 500)
  )
  ON CONFLICT (notice_id, extraction_method)
  WHERE notice_id IS NOT NULL
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
    rent_total_huf_year = EXCLUDED.rent_total_huf_year,
    rent_huf_per_ha_year = EXCLUDED.rent_huf_per_ha_year,
    rent_unit = EXCLUDED.rent_unit,
    confidence = EXCLUDED.confidence,
    source_attachment_url = EXCLUDED.source_attachment_url,
    raw_text_excerpt = EXCLUDED.raw_text_excerpt,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notices_rent_observation_upsert
  ON public.notices;

CREATE TRIGGER notices_rent_observation_upsert
  AFTER INSERT OR UPDATE OF rent_normalized_huf_per_ha_year, rent_raw, rent_unit, area_ha, settlement, county, cultivation_branch, publication_date, original_attachment_url, original_detail_url
  ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_notice_rent_observation_from_notice();

CREATE OR REPLACE FUNCTION public.upsert_notice_sale_price_observation_from_notice()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.price_normalized_huf_per_ha IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notice_sale_price_observations (
    notice_id,
    source,
    source_notice_id,
    settlement,
    settlement_clean,
    county,
    municipality,
    publication_date,
    area_ha,
    cultivation_branch,
    price_raw,
    price_total_huf,
    price_huf_per_ha,
    price_unit,
    confidence,
    extraction_method,
    source_attachment_url,
    raw_text_excerpt
  )
  VALUES (
    NEW.id,
    NEW.source,
    NEW.source_notice_id,
    NEW.settlement,
    public.clean_hu_settlement_name(NEW.settlement),
    COALESCE(NEW.county, public.infer_hu_county(concat_ws(' ', NEW.municipality, NEW.settlement))),
    NEW.municipality,
    NEW.publication_date,
    NEW.area_ha,
    NEW.cultivation_branch,
    NEW.price_raw,
    NEW.price_total_huf,
    NEW.price_normalized_huf_per_ha,
    'Ft/ha',
    0.72,
    'notice_import',
    COALESCE(NEW.original_attachment_url, NEW.original_detail_url),
    LEFT(NEW.price_raw, 500)
  )
  ON CONFLICT (notice_id, extraction_method)
  WHERE notice_id IS NOT NULL
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

DROP TRIGGER IF EXISTS notices_sale_price_observation_upsert
  ON public.notices;

CREATE TRIGGER notices_sale_price_observation_upsert
  AFTER INSERT OR UPDATE OF price_normalized_huf_per_ha, price_raw, price_total_huf, area_ha, settlement, county, cultivation_branch, publication_date, original_attachment_url, original_detail_url
  ON public.notices
  FOR EACH ROW
  EXECUTE FUNCTION public.upsert_notice_sale_price_observation_from_notice();

UPDATE public.notice_rent_observations ro
SET
  county = COALESCE(ro.county, public.infer_hu_county(concat_ws(' ', ro.municipality, ro.settlement))),
  source_attachment_url = COALESCE(ro.source_attachment_url, n.original_attachment_url, n.original_detail_url)
FROM public.notices n
WHERE ro.notice_id = n.id
  AND (
    ro.county IS NULL
    OR ro.source_attachment_url IS NULL
  );

UPDATE public.notice_sale_price_observations so
SET
  county = COALESCE(so.county, public.infer_hu_county(concat_ws(' ', so.municipality, so.settlement))),
  source_attachment_url = COALESCE(so.source_attachment_url, n.original_attachment_url, n.original_detail_url)
FROM public.notices n
WHERE so.notice_id = n.id
  AND (
    so.county IS NULL
    OR so.source_attachment_url IS NULL
  );

REVOKE ALL ON FUNCTION public.upsert_notice_rent_observation_from_notice() FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_notice_sale_price_observation_from_notice() FROM anon, authenticated;
