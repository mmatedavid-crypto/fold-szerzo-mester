CREATE OR REPLACE FUNCTION public.guard_notice_deadline_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  previous_deadline date;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    previous_deadline := OLD.deadline_date;
  ELSE
    previous_deadline := NULL;
  END IF;

  IF NEW.deadline_date IS NULL THEN
    NEW.deadline_date := COALESCE(
      previous_deadline,
      NEW.source_deadline_date,
      CASE
        WHEN NEW.raw_json ? 'lejaratNapja'
          AND NULLIF(NEW.raw_json->>'lejaratNapja', '') IS NOT NULL
        THEN ((NEW.raw_json->>'lejaratNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date
        ELSE NULL
      END,
      CASE
        WHEN NEW.raw_json ? 'detail'
          AND NEW.raw_json->'detail' ? 'hirdetmenyDTO'
          AND NEW.raw_json->'detail'->'hirdetmenyDTO' ? 'lejaratNapja'
          AND NULLIF(NEW.raw_json->'detail'->'hirdetmenyDTO'->>'lejaratNapja', '') IS NOT NULL
        THEN ((NEW.raw_json->'detail'->'hirdetmenyDTO'->>'lejaratNapja')::timestamptz AT TIME ZONE 'Europe/Budapest')::date
        ELSE NULL
      END,
      CASE
        WHEN NEW.publication_date IS NOT NULL THEN NEW.publication_date + 30
        ELSE NULL
      END
    );
  END IF;

  IF NEW.source_deadline_date IS NULL THEN
    NEW.source_deadline_date := NEW.deadline_date;
  END IF;

  RETURN NEW;
END;
$$;