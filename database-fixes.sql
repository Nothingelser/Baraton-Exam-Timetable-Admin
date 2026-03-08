-- Run these SQL commands in your Supabase SQL Editor

-- 1. Add last_sign_in_at column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMPTZ;

-- 2. Ensure activity_logs table exists with correct schema
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);

-- 4. Disable RLS on activity_logs table (simplest solution)
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- OR if you want to keep RLS enabled, use these policies instead:
-- DROP POLICY IF EXISTS "Users can insert own activity logs" ON activity_logs;
-- DROP POLICY IF EXISTS "Users can read all activity logs" ON activity_logs;
-- 
-- CREATE POLICY "Users can insert own activity logs"
-- ON activity_logs FOR INSERT
-- TO authenticated
-- WITH CHECK (auth.uid() = user_id);
-- 
-- CREATE POLICY "Users can read all activity logs"
-- ON activity_logs FOR SELECT
-- TO authenticated
-- USING (true);

-- 5. Verify the changes
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'activity_logs';

-- 6. Backfill and keep profiles.last_sign_in_at synced from auth.users
UPDATE profiles p
SET last_sign_in_at = u.last_sign_in_at
FROM auth.users u
WHERE p.id = u.id
  AND (p.last_sign_in_at IS DISTINCT FROM u.last_sign_in_at);

CREATE OR REPLACE FUNCTION public.sync_profile_last_sign_in()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET last_sign_in_at = NEW.last_sign_in_at
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_last_sign_in ON auth.users;

CREATE TRIGGER trg_sync_profile_last_sign_in
AFTER UPDATE OF last_sign_in_at ON auth.users
FOR EACH ROW
WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
EXECUTE FUNCTION public.sync_profile_last_sign_in();
