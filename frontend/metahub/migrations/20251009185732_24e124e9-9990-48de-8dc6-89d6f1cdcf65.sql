-- Add delay and duration fields to popups table
ALTER TABLE public.popups
ADD COLUMN delay_seconds INTEGER DEFAULT 2,
ADD COLUMN duration_seconds INTEGER DEFAULT 0;

COMMENT ON COLUMN public.popups.delay_seconds IS 'Popup kaç saniye sonra açılsın (varsayılan: 2)';
COMMENT ON COLUMN public.popups.duration_seconds IS 'Popup kaç saniye sonra otomatik kapansın (0 = kapatma yok)';