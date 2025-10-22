-- Add 'answered' status to support_tickets status constraint
ALTER TABLE support_tickets DROP CONSTRAINT IF EXISTS support_tickets_status_check;

ALTER TABLE support_tickets 
ADD CONSTRAINT support_tickets_status_check 
CHECK (status IN ('open', 'answered', 'resolved', 'closed'));