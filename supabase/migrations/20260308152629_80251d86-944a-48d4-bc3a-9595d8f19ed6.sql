
-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete'
  entity_type TEXT NOT NULL, -- 'material', 'student', 'submission', etc.
  entity_title TEXT,
  entity_subject TEXT,
  entity_category TEXT,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Professors and admins can view all logs
CREATE POLICY "Professors can view activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Professors and admins can insert logs
CREATE POLICY "Professors can insert activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'profesor'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Index for fast queries
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
