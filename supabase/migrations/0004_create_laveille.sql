-- supabase/migrations/0004_create_laveille.sql
-- 1. Table definition for la veille submissions
CREATE TABLE public.laveille (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT,
  description TEXT,
  submitter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending',
  type TEXT NOT NULL DEFAULT 'article',
  cover TEXT,
  source TEXT
);

-- 2. Votes table definition
CREATE TABLE public.laveille_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES public.laveille(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Enable Row-Level Security
ALTER TABLE public.laveille ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.laveille_votes ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for la veille submissions

-- 4.A Public can submit (insert) new entries (anonymous or signed)
CREATE POLICY "Public submit la veille" ON public.laveille FOR INSERT
  WITH CHECK (submitter_id = auth.uid() OR submitter_id IS NULL);

-- 4.B Public can read only approved entries
CREATE POLICY "Public read approved la veille" ON public.laveille FOR SELECT
  USING (status = 'approved');

-- 4.C Editors and admins can read all entries (pending, approved, rejected)
CREATE POLICY "Editors/Admins read all la veille" ON public.laveille FOR SELECT
  USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

-- 4.D Editors and admins can update status of entries
CREATE POLICY "Editors/Admins update la veille status" ON public.laveille FOR UPDATE
  USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (status IN ('pending', 'approved', 'rejected'));

-- 4.E Admins can delete any entry
CREATE POLICY "Admins delete la veille" ON public.laveille FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 4.F Users can delete their own entries
CREATE POLICY "Users delete own la veille
entries" ON public.laveille FOR DELETE
  USING (submitter_id = auth.uid());

-- 4.G Editors and admins can update any entry, users can only update their own
CREATE POLICY "Editors/Admins update la veille" ON public.laveille FOR UPDATE
  USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (submitter_id = auth.uid() OR public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

-- 5. RLS Policies for votes table

-- 5.A Public can vote on entries (insert votes)
CREATE POLICY "Public vote la veille" ON public.laveille_votes FOR INSERT
  WITH CHECK (voter_id = auth.uid());

-- 5.B Public can read votes (to aggregate counts)
CREATE POLICY "Public read la veille votes" ON public.laveille_votes FOR SELECT
  USING (true);

-- 5.C Editors and admins can read all vote records
CREATE POLICY "Editors/Admins read la veille votes" ON public.laveille_votes FOR SELECT
  USING (public.has_role(auth.uid(), 'editor') OR public.has_role(auth.uid(), 'admin'));

-- 5.D Admins can delete vote records
CREATE POLICY "Admins delete la veille votes" ON public.laveille_votes FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- 5.E Users can delete their own vote
CREATE POLICY "Users delete own la veille votes" ON public.laveille_votes FOR DELETE
  USING (voter_id = auth.uid());

-- 6. Prevent multiple votes per user per article
ALTER TABLE public.laveille_votes
  ADD CONSTRAINT one_vote_per_user UNIQUE(article_id, voter_id);
