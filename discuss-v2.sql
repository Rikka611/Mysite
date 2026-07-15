-- 讨论区升级：置顶 / 管理标记 / 点赞 / 举报
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT false;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS likes INT DEFAULT 0;
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS reports INT DEFAULT 0;

-- 确保权限
GRANT ALL ON discussions TO service_role;
GRANT SELECT, INSERT ON discussions TO anon;
GRANT USAGE ON SEQUENCE discussions_id_seq TO anon;
