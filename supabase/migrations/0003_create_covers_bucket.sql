-- 0003_create_covers_bucket.sql

-- 1. Create the bucket as PUBLIC (downloads open)
INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true);

-- 2. Enable RLS on storage.objects
-- ALTER TABLE storage.objects
--  ENABLE ROW LEVEL SECURITY;

-- 3. Secure uploads/upserts for editors and admins
CREATE POLICY "Allow covers upload by editors and admins"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'covers'
    AND EXISTS (
      SELECT 1 FROM public.members m
       WHERE m.user_id = auth.uid()
         AND m.role    IN ('editor','admin')
    )
  );

CREATE POLICY "Allow covers upsert by editors and admins"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'covers'
    AND EXISTS (
      SELECT 1 FROM public.members m
       WHERE m.user_id = auth.uid()
         AND m.role    IN ('editor','admin')
    )
  );
