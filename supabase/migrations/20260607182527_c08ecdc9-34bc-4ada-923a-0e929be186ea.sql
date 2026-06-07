
-- 1. Lock down acceptance_verifications: remove public SELECT
DROP POLICY IF EXISTS "acceptance_verifications public read" ON public.acceptance_verifications;

-- 2. Lock down document_verifications: remove public INSERT (only server/admin writes)
DROP POLICY IF EXISTS "Verifications insert public" ON public.document_verifications;

-- 3. Storage policies for 'contracts' bucket scoped to user folder
DROP POLICY IF EXISTS "Users upload own contract files" ON storage.objects;
CREATE POLICY "Users upload own contract files"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'contracts' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users update own contract files" ON storage.objects;
CREATE POLICY "Users update own contract files"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'contracts' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'contracts' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users delete own contract files" ON storage.objects;
CREATE POLICY "Users delete own contract files"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'contracts' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 4. Lock down SECURITY DEFINER functions: revoke EXECUTE from anon/authenticated where not needed
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.finalize_document(uuid, uuid, text, text, text, text, text, text, text, text, text[], text) FROM PUBLIC, anon, authenticated;
-- has_role must remain executable by authenticated (used by RLS policies); revoke from anon only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
