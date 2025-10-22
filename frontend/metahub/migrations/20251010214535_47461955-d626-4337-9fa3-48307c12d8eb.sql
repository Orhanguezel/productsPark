-- Create exec_sql function for dynamic SQL execution
-- This is used by the update system to apply migrations
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  EXECUTE sql;
END;
$$;

-- Security: Only authenticated users can execute (Edge Function validates admin role)
REVOKE ALL ON FUNCTION public.exec_sql(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql(text) TO authenticated;

-- Reset system version to 1.0.0 for testing
DELETE FROM system_version WHERE version = '1.0.1';

-- Reset update history status to allow re-running
UPDATE update_history 
SET status = 'rolled_back' 
WHERE to_version = '1.0.1' AND status = 'completed';