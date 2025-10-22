-- Remove the problematic trigger and function that's blocking user registration
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
DROP FUNCTION IF EXISTS public.trigger_welcome_email();

-- Welcome email will be sent from frontend after successful registration instead