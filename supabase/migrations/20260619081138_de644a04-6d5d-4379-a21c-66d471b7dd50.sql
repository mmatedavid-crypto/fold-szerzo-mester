-- Klauzula override-ok: ügyvéd/admin felülírhatja a hardcode-olt klauzula
-- címet, szöveget és jogforrás-hivatkozásokat. Minden mentés "frissíti" a
-- klauzulát, ami után az ügyvédi jóváhagyásnak újra meg kell történnie
-- (latestReview.reviewed_at < override.updated_at => pending).

CREATE TABLE public.clause_overrides (
  clause_id text PRIMARY KEY,
  title text,
  body_template text,
  source_refs jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.clause_overrides TO authenticated;
GRANT ALL ON public.clause_overrides TO service_role;

ALTER TABLE public.clause_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read clause overrides"
  ON public.clause_overrides FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lawyers and admins can insert clause overrides"
  ON public.clause_overrides FOR INSERT
  TO authenticated
  WITH CHECK (
    (public.has_role(auth.uid(), 'lawyer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND updated_by = auth.uid()
  );

CREATE POLICY "Lawyers and admins can update clause overrides"
  ON public.clause_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'lawyer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (
    (public.has_role(auth.uid(), 'lawyer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role))
    AND updated_by = auth.uid()
  );

CREATE TRIGGER trg_clause_overrides_updated
  BEFORE UPDATE ON public.clause_overrides
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();