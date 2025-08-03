-- Add sources column to articles table
ALTER TABLE public.articles ADD COLUMN sources JSONB DEFAULT '[]'::jsonb;

-- Add comment to document the sources column structure
COMMENT ON COLUMN public.articles.sources IS 'JSON array of source objects with fields: id, title, url, author, type, description, accessed';
