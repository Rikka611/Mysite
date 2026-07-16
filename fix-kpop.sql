-- KPOP 分类迁移
UPDATE linli_codes SET tags='kpop twice' WHERE code='88WDRG';
UPDATE linli_codes SET tags='kpop nmixx 爻' WHERE code='IF19Z7';
UPDATE linli_codes SET tags='kpop nmixx' WHERE code='BJA676';
UPDATE linli_codes SET tags='kpop 心连心' WHERE code='DLGSLP';
-- Lemon 是日文歌(jpop标签误导)，归入流行
UPDATE linli_codes SET tags='流行' WHERE code='FIQOLB';
