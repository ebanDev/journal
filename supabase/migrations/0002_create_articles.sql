-- 1. Table definition
CREATE TABLE public.articles (
  id           UUID       PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT       NOT NULL,
  content      TEXT       NOT NULL,
  author_id    UUID       NOT NULL
               REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  draft        BOOLEAN    NOT NULL DEFAULT true,
  slug         TEXT,
  cover        TEXT,
  description  TEXT,
  featured     BOOLEAN    NOT NULL DEFAULT false
);

-- New categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  cover TEXT
);

-- Join table for many-to-many
CREATE TABLE public.article_categories (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

-- 2. Enable Row‑Level Security
ALTER TABLE public.articles
  ENABLE ROW LEVEL SECURITY;

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Enable RLS for article_categories
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

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

-- RLS: Anyone can select categories
CREATE POLICY "Select categories" ON public.categories
  FOR SELECT USING (true);

-- RLS: Only editors and admins can insert
CREATE POLICY "Insert categories as editor or admin" ON public.categories
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
  );

-- RLS: Only editors and admins can update
CREATE POLICY "Update categories as editor or admin" ON public.categories
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
  );

-- RLS: Only admins can delete
CREATE POLICY "Delete categories as admin" ON public.categories
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Anyone can select article_categories (for public reading)
CREATE POLICY "Select article_categories" ON public.article_categories
  FOR SELECT USING (true);

-- Only editors and admins can insert
CREATE POLICY "Insert article_categories as editor or admin" ON public.article_categories
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
  );

-- Only editors and admins can update
CREATE POLICY "Update article_categories as editor or admin" ON public.article_categories
  FOR UPDATE USING (
    public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
  ) WITH CHECK (
    public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin')
  );

-- Only admins can delete
CREATE POLICY "Delete article_categories as admin" ON public.article_categories
  FOR DELETE USING (
    public.has_role(auth.uid(), 'admin')
  );

-- Create function to get article for preview (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_article_for_preview(article_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  published_at TIMESTAMPTZ,
  draft BOOLEAN,
  slug TEXT,
  cover TEXT,
  description TEXT,
  featured BOOLEAN,
  issue_id UUID,
  sources JSONB,
  embedding VECTOR(1536),
  categories JSONB
)
LANGUAGE SQL
SECURITY DEFINER AS $$
  SELECT 
    a.id,
    a.title,
    a.content,
    a.author_id,
    a.published_at,
    a.draft,
    a.slug,
    a.cover,
    a.description,
    a.featured,
    a.issue_id,
    COALESCE(a.sources, '[]'::jsonb) as sources,
    a.embedding,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'name', c.name,
            'icon', c.icon
          )
        )
        FROM public.article_categories ac
        JOIN public.categories c ON ac.category_id = c.id
        WHERE ac.article_id = a.id
      ),
      '[]'::jsonb
    ) as categories
  FROM public.articles a
  WHERE a.id = article_id;
$$;
