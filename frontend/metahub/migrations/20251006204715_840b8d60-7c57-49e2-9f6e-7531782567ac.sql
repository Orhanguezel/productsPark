-- Add is_active column to profiles table for user account status
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_active IS 'User account active status - admins can freeze/unfreeze accounts';