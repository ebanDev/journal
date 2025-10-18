-- Add cover metadata fields to articles
ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS cover_label TEXT,
  ADD COLUMN IF NOT EXISTS cover_crop TEXT NOT NULL DEFAULT 'middle' CHECK (cover_crop IN ('top', 'middle', 'bottom'));

-- Drop existing preview helper if it exists

DROP FUNCTION IF EXISTS public.get_article_for_preview(UUID);

-- Update preview helper to expose the new fields
CREATE FUNCTION public.get_article_for_preview(article_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  content TEXT,
  author_id UUID,
  published_at TIMESTAMPTZ,
  draft BOOLEAN,
  slug TEXT,
  cover TEXT,
  cover_label TEXT,
  cover_crop TEXT,
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
    a.cover_label,
    a.cover_crop,
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
