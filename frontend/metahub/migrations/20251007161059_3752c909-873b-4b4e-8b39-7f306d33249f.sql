-- Drop and recreate pg_net extension in correct schema
DROP EXTENSION IF EXISTS pg_net CASCADE;
CREATE EXTENSION pg_net WITH SCHEMA extensions;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA net TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA net TO postgres;
GRANT ALL ON ALL ROUTINES IN SCHEMA net TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA net TO postgres;

-- Unschedule existing job if exists
SELECT cron.unschedule('smm-order-status-sync');

-- Reschedule the SMM API status check to run every 5 minutes with correct schema
SELECT cron.schedule(
  'smm-order-status-sync',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://krbintayhtsfoqpkgsbv.metahub.co/functions/v1/smm-api-status',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYmludGF5aHRzZm9xcGtnc2J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTcwMzU5NCwiZXhwIjoyMDc1Mjc5NTk0fQ.JHZ_kqeANSDVmGUoB9wNOcqk5_yg9Wz-QqhHOKOCbSo"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);