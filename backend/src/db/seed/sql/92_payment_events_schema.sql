-- 92_payment_events_schema.sql (final)
DROP TABLE IF EXISTS `payment_events`;

CREATE TABLE `payment_events` (
  `id`         CHAR(36)      NOT NULL,
  `payment_id` CHAR(36)      NOT NULL,
  `event_type` VARCHAR(32)   NOT NULL,
  `message`    VARCHAR(500)  NOT NULL,
  `raw`        TEXT                   DEFAULT NULL,
  `created_at` DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `payment_events_payment_idx` (`payment_id`),
  KEY `payment_events_type_idx`    (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
