-- 讨论区表
CREATE TABLE IF NOT EXISTS discussions (
  id SERIAL PRIMARY KEY,
  name TEXT DEFAULT '匿名用户',
  content TEXT NOT NULL,
  parent_id INT REFERENCES discussions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 权限
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon can read discussions" ON discussions FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert discussions" ON discussions FOR INSERT TO anon WITH CHECK (true);
GRANT SELECT, INSERT ON discussions TO anon;
GRANT USAGE ON SEQUENCE discussions_id_seq TO anon;
