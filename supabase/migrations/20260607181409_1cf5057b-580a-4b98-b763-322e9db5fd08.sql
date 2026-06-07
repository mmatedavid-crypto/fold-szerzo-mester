
-- Settlement cleaner: removes "vétel" segments, leading numeric prefixes, dashes, trims
CREATE OR REPLACE FUNCTION public.clean_settlement(_raw text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  s text;
  parts text[];
  last_part text;
BEGIN
  IF _raw IS NULL THEN RETURN NULL; END IF;
  s := _raw;
  -- If contains " - ", take the last segment (handles "vétel - Debrecen" and "120 évnél... - X")
  IF position(' - ' in s) > 0 THEN
    parts := string_to_array(s, ' - ');
    last_part := parts[array_length(parts, 1)];
    s := last_part;
  END IF;
  -- Remove "vétel" word (case insensitive) and stray dashes
  s := regexp_replace(s, 'vétel', '', 'gi');
  s := regexp_replace(s, '-', ' ', 'g');
  -- Remove leading numeric prefix (e.g. "6041 Kerekegyháza" -> "Kerekegyháza")
  s := regexp_replace(s, '^\s*\d+\s+', '');
  -- Collapse whitespace and trim
  s := regexp_replace(s, '\s+', ' ', 'g');
  s := btrim(s);
  IF s = '' THEN RETURN NULL; END IF;
  RETURN s;
END $$;

-- Subscriptions table
CREATE TABLE public.notice_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  settlement_clean TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active', -- active | unsubscribed | expired
  unsubscribe_token TEXT NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '52 weeks'),
  last_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email, settlement_clean)
);

GRANT SELECT, INSERT, UPDATE ON public.notice_subscriptions TO authenticated;
GRANT ALL ON public.notice_subscriptions TO service_role;

ALTER TABLE public.notice_subscriptions ENABLE ROW LEVEL SECURITY;

-- No direct client access: all operations go through server functions / public hooks using service role
CREATE POLICY "service role only"
  ON public.notice_subscriptions FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE INDEX idx_notice_subscriptions_active
  ON public.notice_subscriptions (settlement_clean)
  WHERE status = 'active';

CREATE INDEX idx_notice_subscriptions_token
  ON public.notice_subscriptions (unsubscribe_token);

CREATE TRIGGER trg_notice_subscriptions_updated_at
  BEFORE UPDATE ON public.notice_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
