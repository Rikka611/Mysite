-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id INT,
  detail TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 权限
GRANT SELECT, INSERT ON audit_log TO service_role;
GRANT USAGE ON SEQUENCE audit_log_id_seq TO service_role;
