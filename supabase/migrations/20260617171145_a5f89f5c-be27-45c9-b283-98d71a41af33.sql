
-- Restrict clause_reviews SELECT to lawyers/admins
DROP POLICY IF EXISTS "Authenticated users can read clause reviews" ON public.clause_reviews;
CREATE POLICY "Lawyers and admins can read clause reviews"
ON public.clause_reviews
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'lawyer'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));

-- usage_logs: allow users to insert only their own log rows
CREATE POLICY "Users insert own usage logs"
ON public.usage_logs
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- document_verifications: explicit deny for client INSERT (service role bypasses RLS)
CREATE POLICY "No client inserts on document_verifications"
ON public.document_verifications
FOR INSERT
TO authenticated, anon
WITH CHECK (false);
