-- 1. Table definition
CREATE TABLE public.articles (
  id           UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT       NOT NULL,
  content      TEXT       NOT NULL,
  author_id    UUID       NOT NULL
               REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  draft        BOOLEAN    NOT NULL DEFAULT true,
  metadata     JSONB      DEFAULT '{}'::jsonb
);

-- 2. Enable Row‑Level Security
ALTER TABLE public.articles
  ENABLE ROW LEVEL SECURITY;

-- 3. Helper function to read the existing draft flag (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_article_draft(aid UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER AS $$
  SELECT draft FROM public.articles WHERE id = aid;
$$;

-- 4. RLS Policies

-- A) Public can read published articles
CREATE POLICY "Read published articles"
  ON public.articles
  FOR SELECT
  USING ( NOT draft );

-- B) Authors can read their own drafts
CREATE POLICY "Read own drafts"
  ON public.articles
  FOR SELECT
  USING ( author_id = auth.uid() );

-- C) Authenticated users can insert articles as themselves
CREATE POLICY "Insert articles"
  ON public.articles
  FOR INSERT
  WITH CHECK ( author_id = auth.uid() );

-- D) Editors can update own articles but not flip the draft flag
CREATE POLICY "Editors update own without draft‑change"
  ON public.articles
  FOR UPDATE
  USING (
    author_id = auth.uid()
    AND public.has_role(auth.uid(), 'editor')
  )
  WITH CHECK (
    author_id = auth.uid()
    AND draft = public.get_article_draft(id)
  );

-- E) Admins full access (update & delete any article)
CREATE POLICY "Admins full access to articles"
  ON public.articles
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );
