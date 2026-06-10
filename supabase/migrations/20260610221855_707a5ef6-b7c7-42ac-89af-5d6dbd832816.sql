CREATE TABLE IF NOT EXISTS public.hu_settlements (
  name_norm text PRIMARY KEY,
  name text NOT NULL,
  county text NOT NULL
);

GRANT SELECT ON public.hu_settlements TO anon, authenticated;
GRANT ALL ON public.hu_settlements TO service_role;

ALTER TABLE public.hu_settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "hu_settlements public read" ON public.hu_settlements FOR SELECT USING (true);

-- Improved county inference: settlement lookup first, then regex fallback
CREATE OR REPLACE FUNCTION public.infer_hu_county(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path TO 'public'
AS $function$
DECLARE
  c text;
  norm text;
  token text;
BEGIN
  IF input IS NULL OR btrim(input) = '' THEN RETURN NULL; END IF;

  -- 1) Try each whitespace-separated token (lowercased, trimmed of trailing -i/-on etc kept simple)
  FOR token IN
    SELECT lower(btrim(t)) FROM regexp_split_to_table(input, '[\s,/()\-]+') AS t
    WHERE length(btrim(t)) >= 3
  LOOP
    SELECT s.county INTO c FROM public.hu_settlements s WHERE s.name_norm = token LIMIT 1;
    IF c IS NOT NULL THEN RETURN c; END IF;
  END LOOP;

  -- 2) Fallback: county-name regex on the original text
  RETURN CASE
    WHEN input ~* 'bács|bacs' THEN 'Bács-Kiskun'
    WHEN input ~* 'baranya' THEN 'Baranya'
    WHEN input ~* 'békés|bekes' THEN 'Békés'
    WHEN input ~* 'borsod|abaúj|abauj|zemplén|zemplen' THEN 'Borsod-Abaúj-Zemplén'
    WHEN input ~* 'csongrád|csongrad|csanád|csanad' THEN 'Csongrád-Csanád'
    WHEN input ~* 'fejér|fejer' THEN 'Fejér'
    WHEN input ~* 'győr|gyor|moson|sopron' THEN 'Győr-Moson-Sopron'
    WHEN input ~* 'hajdú|hajdu|bihar' THEN 'Hajdú-Bihar'
    WHEN input ~* 'heves' THEN 'Heves'
    WHEN input ~* 'jász|jasz|nagykun|szolnok' THEN 'Jász-Nagykun-Szolnok'
    WHEN input ~* 'komárom|komarom|esztergom' THEN 'Komárom-Esztergom'
    WHEN input ~* 'nógrád|nograd' THEN 'Nógrád'
    WHEN input ~* 'pest|budapest|főváros|fovaros' THEN 'Pest'
    WHEN input ~* 'somogy' THEN 'Somogy'
    WHEN input ~* 'szabolcs|szatmár|szatmar|bereg' THEN 'Szabolcs-Szatmár-Bereg'
    WHEN input ~* 'tolna' THEN 'Tolna'
    WHEN input ~* 'vas' THEN 'Vas'
    WHEN input ~* 'veszprém|veszprem' THEN 'Veszprém'
    WHEN input ~* 'zala' THEN 'Zala'
    ELSE NULL
  END;
END;
$function$;