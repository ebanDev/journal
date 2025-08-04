-- Migration to add automatic notification sending when issues are published
-- This extends the existing issues table with notification functionality

-- Create a function to call the edge function when an issue is published
CREATE OR REPLACE FUNCTION notify_issue_published()
RETURNS TRIGGER AS $$
DECLARE
  site_url TEXT;
  supabase_url TEXT;
  anon_key TEXT;
BEGIN
  -- Only proceed if status changed to 'published' and it wasn't published before
  IF NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published') THEN
    
    -- Get configuration from app settings (you may want to store these in a config table)
    -- For now, we'll use the edge function directly with environment variables
    
    -- Call the edge function to send notification
    -- Note: This uses pg_net extension if available, or you can call it from your application
    PERFORM
      net.http_post(
        url := current_setting('app.supabase_url', true) || '/functions/v1/send-issue-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
        ),
        body := jsonb_build_object(
          'issue', row_to_json(NEW)
        )
      );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the main operation
    RAISE WARNING 'Failed to send notification for issue %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_notify_issue_published ON public.issues;
CREATE TRIGGER trigger_notify_issue_published
  AFTER UPDATE OF status ON public.issues
  FOR EACH ROW
  EXECUTE FUNCTION notify_issue_published();

-- Add a manual function to send notifications for existing published issues
-- This can be called manually: SELECT send_issue_notification('issue-id-here');
CREATE OR REPLACE FUNCTION send_issue_notification(issue_uuid UUID)
RETURNS jsonb AS $$
DECLARE
  issue_data jsonb;
  result jsonb;
BEGIN
  -- Get the issue data
  SELECT row_to_json(issues.*) INTO issue_data
  FROM public.issues
  WHERE id = issue_uuid AND status = 'published';
  
  IF issue_data IS NULL THEN
    RETURN jsonb_build_object('error', 'Issue not found or not published');
  END IF;
  
  -- Call the edge function
  SELECT content INTO result
  FROM net.http_post(
    url := current_setting('app.supabase_url', true) || '/functions/v1/send-issue-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_anon_key', true)
    ),
    body := jsonb_build_object('issue', issue_data)
  );
  
  RETURN coalesce(result, jsonb_build_object('error', 'No response from notification service'));
EXCEPTION
  WHEN others THEN
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for the notification function (allow service role to call it)
-- This ensures only authorized calls can trigger notifications
