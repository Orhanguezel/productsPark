-- Update the constraint to include 'in_progress' status
ALTER TABLE update_history 
DROP CONSTRAINT IF EXISTS update_history_status_check;

ALTER TABLE update_history 
ADD CONSTRAINT update_history_status_check 
CHECK (status IN ('in_progress', 'completed', 'failed', 'rolled_back'));

-- Add UPDATE policy for admins
CREATE POLICY "Admins can update update history" ON update_history
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));