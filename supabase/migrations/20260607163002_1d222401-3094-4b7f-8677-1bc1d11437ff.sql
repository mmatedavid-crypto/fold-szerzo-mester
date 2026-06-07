
-- 1) rank_rules: verzionált szabálykészlet
CREATE TABLE public.rank_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  rules JSONB NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.rank_rules TO anon, authenticated;
GRANT ALL ON public.rank_rules TO service_role;
ALTER TABLE public.rank_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rank_rules readable by everyone"
  ON public.rank_rules FOR SELECT
  USING (true);
CREATE POLICY "rank_rules writable by admin"
  ON public.rank_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER rank_rules_touch_updated_at
  BEFORE UPDATE ON public.rank_rules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE UNIQUE INDEX rank_rules_only_one_active
  ON public.rank_rules ((1)) WHERE is_active;

-- 2) acceptance_drafts
CREATE TABLE public.acceptance_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notice_id UUID REFERENCES public.notices(id) ON DELETE SET NULL,
  notice_snapshot JSONB NOT NULL,
  claimant_data JSONB NOT NULL,
  computed_rank INTEGER,
  computed_branch TEXT,
  computed_reason TEXT,
  computed_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  rank_rules_version TEXT,
  deadline_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.acceptance_drafts TO authenticated;
GRANT ALL ON public.acceptance_drafts TO service_role;
ALTER TABLE public.acceptance_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceptance_drafts owner all"
  ON public.acceptance_drafts FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER acceptance_drafts_touch_updated_at
  BEFORE UPDATE ON public.acceptance_drafts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX acceptance_drafts_user_idx ON public.acceptance_drafts(user_id);
CREATE INDEX acceptance_drafts_notice_idx ON public.acceptance_drafts(notice_id);

-- 3) acceptance_documents
CREATE TABLE public.acceptance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES public.acceptance_drafts(id) ON DELETE SET NULL,
  document_number TEXT NOT NULL UNIQUE,
  document_hash TEXT NOT NULL,
  rank_rules_version TEXT NOT NULL,
  notice_snapshot JSONB NOT NULL,
  claimant_snapshot JSONB NOT NULL,
  computed_rank INTEGER NOT NULL,
  pdf_file_path TEXT NOT NULL,
  verification_token TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.acceptance_documents TO authenticated;
GRANT ALL ON public.acceptance_documents TO service_role;
ALTER TABLE public.acceptance_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceptance_documents owner read"
  ON public.acceptance_documents FOR SELECT
  USING (auth.uid() = user_id);
CREATE TRIGGER acceptance_documents_touch_updated_at
  BEFORE UPDATE ON public.acceptance_documents
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX acceptance_documents_user_idx ON public.acceptance_documents(user_id);

-- 4) acceptance_verifications (publikus, PII nélkül)
CREATE TABLE public.acceptance_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT NOT NULL UNIQUE,
  document_id UUID NOT NULL REFERENCES public.acceptance_documents(id) ON DELETE CASCADE,
  document_hash TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL,
  settlement TEXT,
  parcel_numbers TEXT[],
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.acceptance_verifications TO anon, authenticated;
GRANT ALL ON public.acceptance_verifications TO service_role;
ALTER TABLE public.acceptance_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceptance_verifications public read"
  ON public.acceptance_verifications FOR SELECT
  USING (true);

-- 5) Seed: initial rank rules version (v1.0.0) — engine code is the source of truth,
-- this row exists so every draft/document can reference a version string.
INSERT INTO public.rank_rules (version, is_active, description, rules)
VALUES (
  'v1.0.0',
  true,
  'Földforgalmi tv. 46. § (1)-(4) bekezdés — kezdeti szabálykészlet',
  '{"source":"code","engine":"src/lib/rank/engine.ts"}'::jsonb
);
