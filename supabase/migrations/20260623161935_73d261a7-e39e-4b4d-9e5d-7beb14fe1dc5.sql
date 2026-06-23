CREATE OR REPLACE FUNCTION public.guard_notice_deadline_date()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deadline_date IS NULL THEN
    NEW.deadline_date := COALESCE(
      OLD.deadline_date,
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

DROP TRIGGER IF EXISTS trg_guard_notice_deadline_date ON public.notices;
CREATE TRIGGER trg_guard_notice_deadline_date
BEFORE INSERT OR UPDATE ON public.notices
FOR EACH ROW
EXECUTE FUNCTION public.guard_notice_deadline_date();