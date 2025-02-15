-- First create the function that will be called
CREATE OR REPLACE FUNCTION handle_email_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- Call your Next.js API endpoint
  PERFORM
    http_put(
      'https://your-nextjs-app.com/api/merkle',
      json_build_object(
        'userId', NEW.id,
        'email', NEW.email,
        'verifiedAt', NEW.email_confirmed_at
      )::text,
      'application/json'
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then create the trigger
CREATE TRIGGER on_email_verification
  AFTER UPDATE OF email_confirmed_at ON auth.users
  FOR EACH ROW
  WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION handle_email_verification();