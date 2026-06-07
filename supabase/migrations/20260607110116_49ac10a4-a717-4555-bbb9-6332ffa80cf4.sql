
CREATE POLICY "Users read own contract files" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'contracts' AND (auth.uid()::text) = (storage.foldername(name))[1]);
