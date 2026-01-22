INSERT INTO `api_providers`
(`id`, `name`, `type`, `credentials`, `is_active`)
VALUES
(
  UUID(),
  'Cekilisbayisi',
  'smm',
  JSON_OBJECT(
    'api_url', 'https://cekilisbayisi.com/api/v2',
    'api_key', 'dd6a5d1ad1cda75ee74d34b238bf111c',
    'currency', 'TRY'
  ),
  1
),
(
  UUID(),
  'SMM Provider #2 (placeholder)',
  'smm',
  JSON_OBJECT(
    'api_url', 'https://example-smm-panel-2.com/api/v2',
    'api_key', 'REPLACE_ME',
    'currency', 'USD'
  ),
  0
),
(
  UUID(),
  'SMM Provider #3 (placeholder)',
  'smm',
  JSON_OBJECT(
    'api_url', 'https://example-smm-panel-3.com/api/v1',
    'api_key', 'REPLACE_ME',
    'currency', 'EUR'
  ),
  0
);
