
CREATE TABLE public.land_sale_intakes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitter_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  role_in_deal TEXT NOT NULL CHECK (role_in_deal IN ('seller','buyer','both','other')),
  settlement TEXT,
  parcel_numbers TEXT,
  area_ha NUMERIC,
  cultivation_branch TEXT,
  price_huf NUMERIC,
  counterparty_name TEXT,
  counterparty_contact TEXT,
  preferred_contact TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_progress','contacted','closed')),
  assigned_lawyer_email TEXT,
  source_ip TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.land_sale_intakes TO anon, authenticated;
GRANT SELECT, UPDATE ON public.land_sale_intakes TO authenticated;
GRANT ALL ON public.land_sale_intakes TO service_role;

ALTER TABLE public.land_sale_intakes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a land sale intake"
  ON public.land_sale_intakes
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Lawyers and admins can read intakes"
  ON public.land_sale_intakes
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'lawyer') OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Lawyers and admins can update intakes"
  ON public.land_sale_intakes
  FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'lawyer') OR public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'lawyer') OR public.has_role(auth.uid(), 'admin')
  );

CREATE TRIGGER trg_land_sale_intakes_updated_at
  BEFORE UPDATE ON public.land_sale_intakes
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
