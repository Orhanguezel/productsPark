-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Grant permissions to the postgres user
GRANT USAGE ON SCHEMA cron TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA cron TO postgres;

-- Schedule the SMM API status check to run every 5 minutes
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