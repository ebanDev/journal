-- 0005_create_issues.sql
-- 1. Create the 'issues' table
CREATE TABLE public.issues (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  slug          TEXT        UNIQUE,
  description   TEXT,
  status        TEXT        NOT NULL DEFAULT 'draft', -- draft | ready | published
  is_special    BOOLEAN     DEFAULT false,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- 2. Add issue_id to articles
ALTER TABLE public.articles
ADD COLUMN issue_id UUID REFERENCES public.issues(id) ON DELETE SET NULL;

-- 3. Enable Row-Level Security
ALTER TABLE public.issues
  ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies

-- Allow everyone to SELECT published issues
CREATE POLICY "Select published issues"
  ON public.issues
  FOR SELECT
  USING (status = 'published');

-- Allow editors to SELECT all issues
CREATE POLICY "Select all issues for editors"
  ON public.issues
  FOR SELECT
  USING (public.has_role(auth.uid(), 'editor'));

-- B) Allow inserting issues if user is editor
CREATE POLICY "Insert issue as editor"
  ON public.issues
  FOR INSERT
    WITH CHECK (
    public.has_role(auth.uid(), 'editor')
  );

-- C) Editors can update issues they are working on (basic version)
CREATE POLICY "Editors update issues"
  ON public.issues
  FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'editor')
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'editor')
  );

-- D) Admins full access
CREATE POLICY "Admins full access to issues"
  ON public.issues
  FOR ALL
  USING (
    public.has_role(auth.uid(), 'admin')
  )   
  WITH CHECK (
    public.has_role(auth.uid(), 'admin')
  );
