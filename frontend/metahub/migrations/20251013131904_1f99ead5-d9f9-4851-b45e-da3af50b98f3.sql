-- Database webhook'ları için trigger oluştur
-- Yeni kullanıcı kaydı yapıldığında hoşgeldiniz e-postası gönder

-- Webhook trigger function
CREATE OR REPLACE FUNCTION public.trigger_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- Webhook'u tetikle (welcome-email edge function'ını çağır)
  SELECT extensions.http_post(
    url := current_setting('app.settings.metahub_url') || '/functions/v1/welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW)
    )
  ) INTO request_id;

  RETURN NEW;
END;
$$;

-- Trigger'ı profiles tablosuna ekle (kullanıcı profili oluşturulduğunda)
DROP TRIGGER IF EXISTS on_profile_created_send_welcome ON public.profiles;
CREATE TRIGGER on_profile_created_send_welcome
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_welcome_email();

-- Not: Bu trigger kullanıcı profili oluşturulduğunda çalışır
-- handle_new_user() fonksiyonu auth.users'a insert olduğunda profil oluşturur
