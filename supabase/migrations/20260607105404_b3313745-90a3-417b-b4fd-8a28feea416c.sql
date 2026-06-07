
-- Revoke public execute on internal SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Tighten verification insert: require at least an identifier
DROP POLICY IF EXISTS "Verifications insert public" ON public.document_verifications;
CREATE POLICY "Verifications insert public" ON public.document_verifications
  FOR INSERT WITH CHECK (document_number IS NOT NULL OR document_hash IS NOT NULL);
