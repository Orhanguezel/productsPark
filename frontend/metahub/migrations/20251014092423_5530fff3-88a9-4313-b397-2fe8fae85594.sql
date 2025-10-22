-- Schedule SMM API status sync every 5 minutes
SELECT cron.schedule(
  'smm-api-status-sync',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://krbintayhtsfoqpkgsbv.metahub.co/functions/v1/smm-api-status',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyYmludGF5aHRzZm9xcGtnc2J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MDM1OTQsImV4cCI6MjA3NTI3OTU5NH0.Q23pyUBfvPkko7uczHgf2rS503r4NULecV01cEZFXRY"}'::jsonb,
    body := '{}'::jsonb
  ) as request_id;
  $$
);