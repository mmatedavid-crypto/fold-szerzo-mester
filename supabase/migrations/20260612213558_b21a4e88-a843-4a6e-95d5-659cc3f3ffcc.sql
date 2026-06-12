CREATE TABLE public.clause_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clause_id TEXT NOT NULL,
  clause_version TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('approved','rejected','needs_changes')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high')),
  checklist JSONB NOT NULL DEFAULT '{}'::jsonb,
  comment TEXT,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  reviewer_name TEXT,
  reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_clause_reviews_clause
  ON public.clause_reviews(clause_id, clause_version, reviewed_at DESC);

GRANT SELECT, INSERT ON public.clause_reviews TO authenticated;
GRANT ALL ON public.clause_reviews TO service_role;

ALTER TABLE public.clause_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read clause reviews"
  ON public.clause_reviews FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Lawyers can insert clause reviews"
  ON public.clause_reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'lawyer'::public.app_role)
    AND reviewer_id = auth.uid()
  );

-- Helper: returns true if the most recent review for the given clause+version is "approved".
CREATE OR REPLACE FUNCTION public.is_clause_approved(_clause_id TEXT, _clause_version TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.clause_reviews cr
    WHERE cr.clause_id = _clause_id
      AND cr.clause_version = _clause_version
      AND cr.decision = 'approved'
      AND cr.reviewed_at = (
        SELECT MAX(cr2.reviewed_at)
        FROM public.clause_reviews cr2
        WHERE cr2.clause_id = _clause_id
          AND cr2.clause_version = _clause_version
      )
  )
$$;

GRANT EXECUTE ON FUNCTION public.is_clause_approved(TEXT, TEXT) TO authenticated;