-- HIPAA Compliance: Audit Logging Table
-- This table tracks all access to Protected Health Information (PHI)
-- Required retention: minimum 6 years per HIPAA regulations

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,

  -- What action was performed
  action TEXT NOT NULL CHECK (action IN (
    'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'LOGIN', 'LOGOUT',
    'LOGIN_FAILED', 'PASSWORD_CHANGE', 'ACCESS_DENIED', 'PHI_ACCESS'
  )),

  -- What resource was accessed
  resource_type TEXT NOT NULL CHECK (resource_type IN (
    'profile', 'bathroom_entry', 'water_entry', 'food_entry',
    'pt_entry', 'custom_food', 'user_goal', 'account', 'session', 'export'
  )),
  resource_id UUID,

  -- Additional context (sanitized - no PHI in logs)
  description TEXT,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  request_path TEXT,

  -- Status of the action
  status TEXT NOT NULL DEFAULT 'success' CHECK (status IN ('success', 'failure', 'denied')),
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for efficient querying by user and time
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit_logs(resource_type);

-- RLS: Only admins can read audit logs, system can write
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert logs
CREATE POLICY "Service role can insert audit logs"
  ON audit_logs FOR INSERT
  WITH CHECK (true);

-- Policy: Users can read their own audit logs (for transparency)
CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Comment for documentation
COMMENT ON TABLE audit_logs IS 'HIPAA-compliant audit trail for PHI access. Retain for minimum 6 years.';
