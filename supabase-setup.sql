-- 在 Supabase SQL Editor 中执行此文件

-- 1. 创建成绩表
CREATE TABLE scores (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 1 AND 12),
  time REAL NOT NULL CHECK (time > 0),
  mode TEXT NOT NULL CHECK (mode IN ('easy', 'normal', 'hard')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. 索引
CREATE INDEX idx_scores_mode_time ON scores (mode, time ASC);

-- 3. 公开读、公开写
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can read" ON scores FOR SELECT USING (true);
CREATE POLICY "anyone can insert" ON scores FOR INSERT WITH CHECK (true);
GRANT USAGE ON SEQUENCE scores_id_seq TO anon;
GRANT INSERT ON public.scores TO anon;

-- 4. 每个 mode 只保留前 10 名（通过触发器自动清理）
CREATE OR REPLACE FUNCTION cleanup_scores()
RETURNS trigger AS $$
BEGIN
  DELETE FROM scores
  WHERE mode = NEW.mode
    AND id NOT IN (
      SELECT id FROM scores WHERE mode = NEW.mode
      ORDER BY time ASC LIMIT 10
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_cleanup_scores
AFTER INSERT ON scores
FOR EACH ROW EXECUTE FUNCTION cleanup_scores();
