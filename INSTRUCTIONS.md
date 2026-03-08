# Fix Real-Time User Management & Activity Logging

## Issues Identified:
1. Last login times showing "Never" - not fetching from auth metadata
2. Activity logs not recording - likely RLS blocking inserts

## Required Database Changes:

### 1. Disable RLS on activity_logs table (Run in Supabase SQL Editor):
```sql
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;
```

### 2. OR Create RLS policies if you want to keep RLS enabled:
```sql
-- Allow authenticated users to insert their own activity logs
CREATE POLICY "Users can insert own activity logs"
ON activity_logs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to read all activity logs
CREATE POLICY "Users can read all activity logs"
ON activity_logs FOR SELECT
TO authenticated
USING (true);
```

### 3. Ensure activity_logs table exists with correct schema:
```sql
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
```

## Code Changes Needed:

The fetchUsers function needs to fetch last_sign_in_at from Supabase auth metadata.
However, this requires admin privileges which the client-side code doesn't have.

### Solution: Create a Supabase Edge Function or use a simpler approach

Since you can't access auth.admin from client-side, you have two options:

**Option 1 (Simpler):** Store last_sign_in_at in profiles table and update it on login
**Option 2 (Better):** Create a Supabase Edge Function to fetch auth metadata

For now, implement Option 1 by updating the profiles table on each login.
