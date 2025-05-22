CREATE EXTENSION vector;

ALTER TABLE public.articles
  ADD COLUMN IF NOT EXISTS embedding vector(384);

CREATE INDEX IF NOT EXISTS idx_articles_embedding ON public.articles USING hnsw (embedding vector_ip_ops);

-- Matches document sections using vector similarity search on embeddings
--
-- Returns a setof embeddings so that we can use PostgREST resource embeddings (joins with other tables)
-- Additional filtering like limits can be chained to this function call
create or replace function query_embeddings(embedding vector(384), match_threshold float)
returns setof public.articles
language plpgsql
as $$
#variable_conflict use_variable
begin
  return query
  select *
  from public.articles

  -- The inner product is negative, so we negate match_threshold
  where articles.embedding <#> embedding < -match_threshold

  -- Our embeddings are normalized to length 1, so cosine similarity
  -- and inner product will produce the same query results.
  -- Using inner product which can be computed faster.
  --
  -- For the different distance functions, see https://github.com/pgvector/pgvector
  order by articles.embedding <#> embedding;
end;
$$;

-- Database webhook to update the embedding column

CREATE OR REPLACE TRIGGER "on_inserted_or_updated_embedding"
AFTER INSERT OR UPDATE OF content
ON public.articles FOR EACH ROW
EXECUTE FUNCTION supabase_functions.http_request(
  'https://axwrbtjkwchhxwpuqoax.supabase.co/functions/v1/generate-embedding',
  'POST',
  '{"Content-type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4d3JidGprd2NoaHh3cHVxb2F4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NjY3NTQsImV4cCI6MjA2MDA0Mjc1NH0._Qi1G44fHBh1k8Ijd1fChLWtwbo1ZkknaDWUTZqAsCM"}',
  '{}',
  '5000'
);
