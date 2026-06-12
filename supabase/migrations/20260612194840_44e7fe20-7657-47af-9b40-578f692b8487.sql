UPDATE public.notices
SET publication_date = ((raw_json->>'kifuggesztesNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date
WHERE raw_json->>'kifuggesztesNapja' IS NOT NULL
  AND publication_date IS DISTINCT FROM ((raw_json->>'kifuggesztesNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date;

UPDATE public.notices
SET deadline_date = ((raw_json->>'lejaratNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date,
    source_deadline_date = ((raw_json->>'lejaratNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date
WHERE raw_json->>'lejaratNapja' IS NOT NULL
  AND deadline_date IS DISTINCT FROM ((raw_json->>'lejaratNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date;

UPDATE public.notice_rent_observations o
SET publication_date = n.publication_date
FROM public.notices n
WHERE o.notice_id = n.id
  AND o.publication_date IS DISTINCT FROM n.publication_date;

UPDATE public.notice_sale_price_observations o
SET publication_date = n.publication_date
FROM public.notices n
WHERE o.notice_id = n.id
  AND o.publication_date IS DISTINCT FROM n.publication_date;