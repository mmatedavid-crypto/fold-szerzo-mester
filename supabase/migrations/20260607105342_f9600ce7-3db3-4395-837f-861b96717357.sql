
-- ============ ROLES ============
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- updated_at helper
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- ============ USERS PROFILE ============
CREATE TABLE public.users_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  billing_type TEXT CHECK (billing_type IN ('magan','ceg')),
  billing_name TEXT,
  billing_address TEXT,
  tax_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users_profile TO authenticated;
GRANT ALL ON public.users_profile TO service_role;
ALTER TABLE public.users_profile ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own profile" ON public.users_profile FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_users_profile_updated BEFORE UPDATE ON public.users_profile
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users_profile (user_id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============ PLANS ============
CREATE TABLE public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  monthly_price_huf INTEGER NOT NULL,
  annual_quota INTEGER NOT NULL,
  price_label TEXT NOT NULL DEFAULT 'bruttó',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.plans TO anon, authenticated;
GRANT ALL ON public.plans TO service_role;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Plans public read" ON public.plans FOR SELECT USING (true);
CREATE POLICY "Admins manage plans" ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.plans (slug, name, description, monthly_price_huf, annual_quota, sort_order) VALUES
  ('single', 'Egy szerződés', 'Egyszeri szerződésgenerálás', 9900, 1, 1),
  ('gazda', 'Gazda csomag', 'Akár 50 szerződés évente', 29900, 50, 2),
  ('pro', 'Pro gazdaság', 'Akár 150 szerződés évente', 49900, 150, 3);

-- ============ SUBSCRIPTIONS ============
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','past_due','cancelled','expired')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  current_period_end TIMESTAMPTZ NOT NULL,
  annual_quota INTEGER NOT NULL,
  used_quota INTEGER NOT NULL DEFAULT 0,
  quota_period_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  quota_period_end TIMESTAMPTZ NOT NULL,
  payment_provider TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own subscriptions read" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins read all subs" ON public.subscriptions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ DOCUMENT CREDITS ============
CREATE TABLE public.document_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('single_purchase','subscription')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available','used','expired','refunded')),
  document_id UUID,
  payment_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  used_at TIMESTAMPTZ
);
GRANT SELECT ON public.document_credits TO authenticated;
GRANT ALL ON public.document_credits TO service_role;
ALTER TABLE public.document_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own credits" ON public.document_credits FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ CONTRACT DRAFTS ============
CREATE TABLE public.contract_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','awaiting_payment','finalized')),
  title TEXT,
  lessor_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  lessee_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  parcels JSONB NOT NULL DEFAULT '[]'::jsonb,
  rent JSONB NOT NULL DEFAULT '{}'::jsonb,
  term JSONB NOT NULL DEFAULT '{}'::jsonb,
  prelease JSONB NOT NULL DEFAULT '{}'::jsonb,
  clauses JSONB NOT NULL DEFAULT '{}'::jsonb,
  risk_report JSONB,
  core_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_drafts TO authenticated;
GRANT ALL ON public.contract_drafts TO service_role;
ALTER TABLE public.contract_drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own drafts" ON public.contract_drafts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_drafts_updated BEFORE UPDATE ON public.contract_drafts FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ GENERATED DOCUMENTS ============
CREATE TABLE public.generated_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  draft_id UUID REFERENCES public.contract_drafts(id) ON DELETE SET NULL,
  document_number TEXT NOT NULL UNIQUE,
  document_hash TEXT NOT NULL,
  core_hash TEXT NOT NULL,
  legal_template_version TEXT NOT NULL,
  clause_version TEXT NOT NULL,
  lessor_name TEXT,
  lessee_name TEXT,
  settlement TEXT,
  parcel_numbers TEXT[],
  finalized_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  pdf_file_path TEXT,
  verification_status TEXT NOT NULL DEFAULT 'valid'
);
GRANT SELECT ON public.generated_documents TO authenticated;
GRANT SELECT ON public.generated_documents TO anon;
GRANT ALL ON public.generated_documents TO service_role;
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own docs" ON public.generated_documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin docs" ON public.generated_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ PAYMENTS ============
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_huf INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'HUF',
  product_type TEXT NOT NULL CHECK (product_type IN ('single','subscription_gazda','subscription_pro')),
  plan_id UUID REFERENCES public.plans(id),
  draft_id UUID REFERENCES public.contract_drafts(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','failed','refunded')),
  provider TEXT NOT NULL,
  provider_payment_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own payments" ON public.payments FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ LEGAL TEMPLATE VERSIONS ============
CREATE TABLE public.legal_template_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','archived')),
  effective_from TIMESTAMPTZ,
  notes TEXT,
  legal_sources TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.legal_template_versions TO authenticated;
GRANT ALL ON public.legal_template_versions TO service_role;
ALTER TABLE public.legal_template_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Templates read auth" ON public.legal_template_versions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage templates" ON public.legal_template_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.legal_template_versions (version, status, effective_from, notes, legal_sources)
VALUES ('2026.01', 'active', now(), 'Kezdő aktív sablonverzió', '2013. évi CXXII. tv. (Földforgalmi tv.); 2013. évi CCXII. tv.');

-- ============ CLAUSES ============
CREATE TABLE public.clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_template_version_id UUID NOT NULL REFERENCES public.legal_template_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  clause_key TEXT NOT NULL,
  text TEXT NOT NULL,
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (legal_template_version_id, clause_key)
);
GRANT SELECT ON public.clauses TO authenticated;
GRANT ALL ON public.clauses TO service_role;
ALTER TABLE public.clauses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Clauses read auth" ON public.clauses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage clauses" ON public.clauses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_clauses_updated BEFORE UPDATE ON public.clauses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Seed core clauses
INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'preamble', 'Preambulum', 'preamble',
  'Amely létrejött egyrészről {{lessor_name}} (lakcím: {{lessor_address}}, adóazonosító/adószám: {{lessor_tax}}) mint haszonbérbeadó (a továbbiakban: Haszonbérbeadó), másrészről {{lessee_name}} (lakcím/székhely: {{lessee_address}}, adószám/adóazonosító: {{lessee_tax}}) mint haszonbérlő (a továbbiakban: Haszonbérlő) között az alábbi feltételekkel.',
  10
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'subject', 'Szerződés tárgya', 'subject',
  '1. Haszonbérbeadó haszonbérbe adja, Haszonbérlő haszonbérbe veszi az alábbi termőföld(ek)et: {{parcels_block}}',
  20
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'term', 'Haszonbérleti időtartam', 'term',
  '2. A haszonbérlet határozott időtartamra, {{term_start}} napjától {{term_end}} napjáig szól. Az első gazdasági év: {{first_economic_year}}. A birtokbaadás napja: {{possession_date}}.',
  30
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'rent', 'Haszonbérleti díj', 'rent',
  '3. A haszonbérleti díj: {{rent_description}}. Fizetési határidő: {{rent_deadline}}. Fizetés módja: {{rent_method}}. {{rent_indexation}}',
  40
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'prelease', 'Előhaszonbérleti jog', 'prelease',
  '4. A Felek rögzítik, hogy az előhaszonbérleti jogosultság sorrendje a 2013. évi CXXII. törvény vonatkozó rendelkezései szerint a következő: {{prelease_rank}}. Jogalap: {{prelease_basis}}.',
  50
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'use', 'Földhasználat', 'use',
  '5. Haszonbérlő köteles a földet rendeltetésszerűen, a jó gazda gondosságával művelni, a művelési ágat megőrizni, és a talajvédelmi előírásokat betartani. Albérlet, illetve a használat átengedése Haszonbérbeadó írásbeli hozzájárulása nélkül kizárt.',
  60
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'termination', 'Megszűnés', 'termination',
  '6. A szerződés a határozott idő lejártával szűnik meg. Rendkívüli felmondásra a Ptk. és a földforgalmi jogszabályok szerint van lehetőség.',
  70
FROM public.legal_template_versions WHERE version='2026.01';

INSERT INTO public.clauses (legal_template_version_id, category, title, clause_key, text, sort_order)
SELECT id, 'misc', 'Záró rendelkezések', 'misc',
  '7. A jelen szerződésben nem szabályozott kérdésekben a Ptk. és a termőföldre vonatkozó hatályos jogszabályok rendelkezései az irányadók. Vitás kérdésekben a Felek elsősorban békés úton kívánnak megegyezni. A szerződés annyi eredeti példányban készül, amennyi a közzétételhez és a Felek részére szükséges.',
  80
FROM public.legal_template_versions WHERE version='2026.01';

-- ============ NOTICES (Phase 3) ============
CREATE TABLE public.notices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL DEFAULT 'hirdetmenyek.gov.hu',
  source_notice_id TEXT,
  source_attachment_id TEXT,
  original_detail_url TEXT,
  original_attachment_url TEXT,
  notice_type TEXT,
  settlement TEXT,
  county TEXT,
  parcel_numbers TEXT[],
  subject TEXT,
  area_raw TEXT,
  area_ha NUMERIC,
  cultivation_branch TEXT,
  rent_raw TEXT,
  rent_unit TEXT,
  rent_normalized_huf_per_ha_year NUMERIC,
  price_raw TEXT,
  publication_date DATE,
  deadline_date DATE,
  municipality TEXT,
  raw_json JSONB,
  last_fetched_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.notices TO anon, authenticated;
GRANT ALL ON public.notices TO service_role;
ALTER TABLE public.notices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Notices public" ON public.notices FOR SELECT USING (true);

-- ============ USAGE LOGS ============
CREATE TABLE public.usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.usage_logs TO authenticated;
GRANT ALL ON public.usage_logs TO service_role;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own logs" ON public.usage_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admin all logs" ON public.usage_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ DOCUMENT VERIFICATIONS ============
CREATE TABLE public.document_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES public.generated_documents(id) ON DELETE SET NULL,
  document_number TEXT,
  document_hash TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  result TEXT NOT NULL,
  ip_address TEXT
);
GRANT SELECT, INSERT ON public.document_verifications TO anon, authenticated;
GRANT ALL ON public.document_verifications TO service_role;
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Verifications insert public" ON public.document_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin reads verifications" ON public.document_verifications FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ============ FINALIZE RPC ============
-- Atomic credit consumption + document insert
CREATE OR REPLACE FUNCTION public.finalize_document(
  _user_id UUID,
  _draft_id UUID,
  _document_number TEXT,
  _document_hash TEXT,
  _core_hash TEXT,
  _template_version TEXT,
  _clause_version TEXT,
  _lessor_name TEXT,
  _lessee_name TEXT,
  _settlement TEXT,
  _parcel_numbers TEXT[],
  _pdf_file_path TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _doc_id UUID;
  _credit_id UUID;
  _sub_id UUID;
BEGIN
  -- Try a single_purchase available credit first
  SELECT id INTO _credit_id FROM public.document_credits
   WHERE user_id = _user_id AND status = 'available' AND source_type='single_purchase'
   ORDER BY created_at LIMIT 1 FOR UPDATE SKIP LOCKED;

  IF _credit_id IS NULL THEN
    -- Try active subscription quota
    SELECT id INTO _sub_id FROM public.subscriptions
     WHERE user_id = _user_id AND status='active' AND now() < quota_period_end
       AND used_quota < annual_quota
     ORDER BY current_period_end DESC LIMIT 1 FOR UPDATE;

    IF _sub_id IS NULL THEN
      RAISE EXCEPTION 'no_credit_or_quota';
    END IF;
  END IF;

  INSERT INTO public.generated_documents(
    user_id, draft_id, document_number, document_hash, core_hash,
    legal_template_version, clause_version, lessor_name, lessee_name,
    settlement, parcel_numbers, pdf_file_path
  ) VALUES (
    _user_id, _draft_id, _document_number, _document_hash, _core_hash,
    _template_version, _clause_version, _lessor_name, _lessee_name,
    _settlement, _parcel_numbers, _pdf_file_path
  ) RETURNING id INTO _doc_id;

  IF _credit_id IS NOT NULL THEN
    UPDATE public.document_credits SET status='used', used_at=now(), document_id=_doc_id WHERE id=_credit_id;
  ELSE
    UPDATE public.subscriptions SET used_quota = used_quota + 1, updated_at=now() WHERE id=_sub_id;
    INSERT INTO public.document_credits(user_id, source_type, status, document_id, used_at)
      VALUES (_user_id, 'subscription', 'used', _doc_id, now());
  END IF;

  UPDATE public.contract_drafts SET status='finalized', updated_at=now() WHERE id=_draft_id AND user_id=_user_id;

  INSERT INTO public.usage_logs(user_id, action, entity_type, entity_id, metadata)
    VALUES (_user_id, 'document.finalized', 'generated_document', _doc_id,
            jsonb_build_object('document_number', _document_number));

  RETURN _doc_id;
END $$;

REVOKE ALL ON FUNCTION public.finalize_document FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.finalize_document TO service_role;
