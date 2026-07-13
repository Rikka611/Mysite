-- ============================================================
-- 统计系统升级
-- 在 Supabase SQL Editor 中执行
-- ============================================================

-- 1. 服务端去重 + 原子递增（一次 RPC 调用搞定）
CREATE TABLE IF NOT EXISTS visitors (
  fp TEXT NOT NULL,
  item_id INT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('view','like')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (fp, item_id, action)
);
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all on visitors" ON visitors FOR ALL USING (true) WITH CHECK (true);
GRANT INSERT, SELECT ON public.visitors TO anon;

-- 去重 + 原子递增合并函数
CREATE OR REPLACE FUNCTION track(fp_in TEXT, item_id_in INT, action_in TEXT) RETURNS void AS $$
BEGIN
  INSERT INTO visitors (fp, item_id, action) VALUES (fp_in, item_id_in, action_in);
  IF action_in = 'view' THEN
    UPDATE linli_codes SET views = views + 1 WHERE id = item_id_in;
  ELSIF action_in = 'like' THEN
    UPDATE linli_codes SET likes = likes + 1 WHERE id = item_id_in;
  END IF;
EXCEPTION WHEN unique_violation THEN
  -- 已存在，忽略
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION track TO anon;

-- 2. 浏览量/点赞原子递增（单独调用，不去重）
CREATE OR REPLACE FUNCTION inc_view(row_id int) RETURNS void AS $$
  UPDATE linli_codes SET views = views + 1 WHERE id = row_id;
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION inc_like(row_id int) RETURNS void AS $$
  UPDATE linli_codes SET likes = likes + 1 WHERE id = row_id;
$$ LANGUAGE sql;

GRANT EXECUTE ON FUNCTION inc_view TO anon;
GRANT EXECUTE ON FUNCTION inc_like TO anon;

-- 3. 每小时统计物化视图
CREATE MATERIALIZED VIEW IF NOT EXISTS hourly_stats AS
SELECT date_trunc('hour', created_at) AS hour,
       count(*) AS uploads,
       coalesce(sum(views),0) AS total_views,
       coalesce(sum(likes),0) AS total_likes
FROM linli_codes
GROUP BY hour
ORDER BY hour;
