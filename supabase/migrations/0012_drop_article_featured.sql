-- Article a la une is now derived from the latest published article.
DROP FUNCTION IF EXISTS public.get_article_for_preview(UUID);

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

ALTER TABLE public.articles
  DROP COLUMN IF EXISTS featured;
