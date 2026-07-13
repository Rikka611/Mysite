# linli — 林离 MIDI 分享码

在线分享和发现 Autopiano MIDI 乐谱代码。

## 项目结构

```
linli/          用户端 SPA
linli-admin/    管理后台
shared/js/      共享 JS 模块（api / sanitize / charts / paginate）
shared/css/     共享样式（theme.css）
supabase-setup-linli.sql  数据库初始化脚本
scripts/        构建校验脚本
```

## 部署

1. 复制 `shared/js/config.template.js` → `shared/js/config.js` 并填入 Supabase key
2. 在 Supabase 执行 `supabase-setup-linli.sql`
3. 部署静态文件到任意托管服务（Netlify / Vercel / GitHub Pages）

## 技术栈

- 纯 HTML/JS/CSS（无框架）
- Supabase (PostgreSQL + REST API)
- Canvas 2D 图表
