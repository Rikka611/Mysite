-- INSERT 速率限制：每分钟最多 10 条
CREATE OR REPLACE FUNCTION check_insert_rate()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM linli_codes WHERE created_at > NOW() - INTERVAL '1 minute') > 10 THEN
    RAISE EXCEPTION '提交过于频繁，请稍后再试';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_insert_rate ON linli_codes;
CREATE TRIGGER enforce_insert_rate
  BEFORE INSERT ON linli_codes
  FOR EACH ROW
  EXECUTE FUNCTION check_insert_rate();
