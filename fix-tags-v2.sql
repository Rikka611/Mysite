-- ============================================================
-- 全量标签修正 — 逐首歌匹配分类
-- ============================================================

-- === 番剧OP/ED (anime) ===
-- 鸟之诗（两首）→ AIR
UPDATE linli_codes SET tags='动漫 AIR' WHERE code='I8HR6D';
UPDATE linli_codes SET tags='动漫 AIR' WHERE code='IAB4A8';
-- 咒术回战 → 补标签
UPDATE linli_codes SET tags='动漫 咒术回战' WHERE code='0L644K';
-- Sincerely(Animenz版无标签) → 紫罗兰永恒花园
UPDATE linli_codes SET tags='Animenz 紫罗兰永恒花园' WHERE code='GVP6RY';
-- My Dearest → 罪恶王冠
UPDATE linli_codes SET tags='动漫 罪恶王冠' WHERE code='AU3UW4';
-- 冥河螺旋 → Re:Zero
UPDATE linli_codes SET tags='动漫 Re:Zero' WHERE code='X0UNDH';
-- A叔my dearest → 罪恶王冠
UPDATE linli_codes SET tags='Animenz 动漫 罪恶王冠' WHERE code='EHXOHN';
-- Jane Doe(Animenz) → 补标签
UPDATE linli_codes SET tags='Animenz 动漫' WHERE code='JBV90W';
-- 遠い空へ → 缘之空OST
UPDATE linli_codes SET tags='动漫 缘之空' WHERE code='ODICUL';
-- 怪物 → YOASOBI(BEASTARS)
UPDATE linli_codes SET tags='动漫 YOASOBI' WHERE code='3ALTSH';
-- 圣诞快乐劳伦斯先生(无标签版)
UPDATE linli_codes SET tags='坂本龙一 电影' WHERE code='MV74YC';

-- === 原神 (genshin) ===
-- 莉奈娅PV
UPDATE linli_codes SET tags='原神 莉奈娅' WHERE code='CFQH1I';

-- === 崩坏/绝区零 (honkai) ===
-- 预言(绝区零二周年)
UPDATE linli_codes SET tags='绝区零' WHERE code='J5XB2Z';
-- DAMIDAMI两首
UPDATE linli_codes SET tags='绝区零' WHERE code='MTCL1V';
UPDATE linli_codes SET tags='绝区零' WHERE code='C0L08L';
-- True 崩坏三
UPDATE linli_codes SET tags='崩坏三' WHERE code='C0OR3N';
-- 再度和你 → 崩铁
UPDATE linli_codes SET tags='崩铁 昔涟' WHERE code='CX7A4W';
-- 飞鼠进行曲 → 崩坏
UPDATE linli_codes SET tags='崩坏' WHERE code='TUYDYD';

-- === 术力口/V家 (vocaloid) ===
-- 虚构 → V家(花譜)
UPDATE linli_codes SET tags='V家' WHERE code='P7PSMG';
-- glow → 补V家标签
UPDATE linli_codes SET tags='V家 初音未来 miku' WHERE code='QY4E1S';
-- 千本樱(agc拼写错误) → 修正
UPDATE linli_codes SET tags='V家 初音未来' WHERE code='LZI9ZP';

-- === 其他ACG (acg) ===
-- 魔法使之夜 → 游戏/视觉小说
UPDATE linli_codes SET tags='游戏 视觉小说' WHERE code='0MTYRV';

-- === 流行/经典 (other) ===
UPDATE linli_codes SET tags='流行' WHERE code='2OP56F';
UPDATE linli_codes SET tags='流行' WHERE code='K9DWYU';
UPDATE linli_codes SET tags='电影 久石让' WHERE code='PAYPY7';
