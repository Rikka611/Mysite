-- 模糊搜索：启用 pg_trgm 扩展
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 创建 GIN 索引加速相似度搜索
CREATE INDEX IF NOT EXISTS idx_codes_title_trgm ON linli_codes USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_codes_tags_trgm ON linli_codes USING gin (tags gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_codes_description_trgm ON linli_codes USING gin (description gin_trgm_ops);
