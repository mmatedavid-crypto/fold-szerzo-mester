UPDATE public.notice_rent_observations
SET county = public.infer_hu_county(COALESCE(settlement_clean, settlement, municipality))
WHERE county IS NULL
  AND public.infer_hu_county(COALESCE(settlement_clean, settlement, municipality)) IS NOT NULL;

UPDATE public.notice_sale_price_observations
SET county = public.infer_hu_county(COALESCE(settlement_clean, settlement, municipality))
WHERE county IS NULL
  AND public.infer_hu_county(COALESCE(settlement_clean, settlement, municipality)) IS NOT NULL;