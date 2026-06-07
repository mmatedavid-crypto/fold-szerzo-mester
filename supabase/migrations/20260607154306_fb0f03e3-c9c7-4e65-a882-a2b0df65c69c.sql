GRANT SELECT ON public.notices TO anon, authenticated;
GRANT ALL ON public.notices TO service_role;
CREATE UNIQUE INDEX IF NOT EXISTS notices_source_unique ON public.notices (source, source_notice_id);
CREATE INDEX IF NOT EXISTS notices_settlement_idx ON public.notices (settlement);
CREATE INDEX IF NOT EXISTS notices_deadline_idx ON public.notices (deadline_date);