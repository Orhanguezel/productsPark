-- Sistem versiyon tablosu
CREATE TABLE IF NOT EXISTS system_version (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- İlk versiyonu ekle
INSERT INTO system_version (version) 
VALUES ('1.0.0')
ON CONFLICT DO NOTHING;

-- Güncelleme geçmişi tablosu
CREATE TABLE IF NOT EXISTS update_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_version TEXT NOT NULL,
  to_version TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('completed', 'failed', 'rolled_back')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  applied_by UUID REFERENCES auth.users(id),
  changelog TEXT
);

-- Güncelleme snapshots (rollback için)
CREATE TABLE IF NOT EXISTS update_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version TEXT NOT NULL,
  snapshot_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS politikaları
ALTER TABLE system_version ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE update_snapshots ENABLE ROW LEVEL SECURITY;

-- Sadece adminler görebilir
CREATE POLICY "Admins can view system version" ON system_version
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update system version" ON system_version
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view update history" ON update_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert update history" ON update_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view snapshots" ON update_snapshots
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can create snapshots" ON update_snapshots
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));