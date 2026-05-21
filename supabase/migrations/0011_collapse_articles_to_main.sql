INSERT INTO public.issues (title, slug, description, status, published_at)
VALUES ('MAIN', 'main', '', 'published', now())
ON CONFLICT (slug) DO UPDATE
SET
  title = 'MAIN',
  status = 'published',
  published_at = COALESCE(public.issues.published_at, EXCLUDED.published_at);

UPDATE public.articles
SET issue_id = (SELECT id FROM public.issues WHERE slug = 'main')
WHERE issue_id IS DISTINCT FROM (SELECT id FROM public.issues WHERE slug = 'main');

DROP TRIGGER IF EXISTS trigger_notify_issue_published ON public.issues;
DROP FUNCTION IF EXISTS public.notify_issue_published();
DROP FUNCTION IF EXISTS public.send_issue_notification(UUID);

CREATE OR REPLACE FUNCTION public.notify_article_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.draft = false AND (OLD.draft IS NULL OR OLD.draft = true) THEN
    PERFORM
      net.http_post(
        url := current_setting('app.supabase_url', true) || '/functions/v1/send-article-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := jsonb_build_object(
          'article', row_to_json(NEW)
        )
      );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE WARNING 'Failed to send notification for article %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_article_published ON public.articles;
CREATE TRIGGER trigger_notify_article_published
  AFTER UPDATE OF draft ON public.articles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_article_published();

CREATE OR REPLACE FUNCTION public.send_article_notification(article_uuid UUID)
RETURNS jsonb AS $$
DECLARE
  article_data jsonb;
  result jsonb;
BEGIN
  SELECT row_to_json(articles.*) INTO article_data
  FROM public.articles
  WHERE id = article_uuid AND draft = false;

  IF article_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Article not found or not published');
  END IF;

  SELECT content INTO result
  FROM net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/send-article-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
    ),
    body := jsonb_build_object('article', article_data)
  );

  RETURN coalesce(result, jsonb_build_object('error', 'No response from notification service'));
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
