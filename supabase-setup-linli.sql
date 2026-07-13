-- 林离 MIDI 分享码表
CREATE TABLE linli_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(6) NOT NULL CHECK (code ~ '^[A-Za-z0-9]{6}$'),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 50),
  description TEXT DEFAULT '',
  author TEXT DEFAULT '匿名',
  tags TEXT DEFAULT '',
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_linli_status ON linli_codes (status);
CREATE INDEX idx_linli_views ON linli_codes (views DESC);
CREATE INDEX idx_linli_newest ON linli_codes (created_at DESC);
CREATE INDEX idx_linli_code ON linli_codes (code);

ALTER TABLE linli_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read approved" ON linli_codes FOR SELECT USING (status = 'approved');
CREATE POLICY "anyone can insert" ON linli_codes FOR INSERT WITH CHECK (true);

-- 更新浏览量（公开）
CREATE POLICY "anyone can update views" ON linli_codes FOR UPDATE
  USING (status = 'approved')
  WITH CHECK (status = 'approved');

GRANT USAGE ON SEQUENCE linli_codes_id_seq TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.linli_codes TO anon;
