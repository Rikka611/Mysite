# 任务计划：Mysite / BSide Olivia Lin 分享码平台

## 目标
为 BSide Olivia Lin（米哈游 AI 钢琴陪伴应用）构建粉丝分享码社区平台，含用户端浏览/提交/搜索/点赞 + 管理后台审核/统计/图表。

## 技术栈
- GitHub Pages 静态托管 (rikka611.github.io/Mysite)
- Supabase (naivizrdefonlelndzqr) PostgreSQL + REST API + RLS
- 纯 HTML/CSS/JS（无框架），Canvas 2D 图表
- 公共模块：shared/js/ (config/api/sanitize/charts/paginate/cache/batch)

## 页面结构

| 页面 | 路径 | 功能 |
|------|------|------|
| 用户端 | /linli/ | 浏览热门/最新/搜索，提交分享码，点赞，复制，分页，流星背景 |
| 管理后台 | /linli-admin/ | 登录 → 审核(通过/拒绝/删除)，统计面板(提交/浏览/访问/点赞)，图表(柱状/饼图/折线)，反馈管理 |
| 个人主页 | /index.html | Vibecoding 项目展示，中英双语 FLIP 切换 |
| 扫雷 | /minesweeper.html | 三种难度，Supabase 在线排行榜 |
| 游戏合集 | /games.html | 游戏入口页 |

## 数据库表（Supabase）

| 表 | 用途 |
|------|------|
| linli_codes | 分享码（code/title/desc/author/tags/views/likes/status）|
| feedbacks | 用户反馈 |
| page_visits | 页面访问记录（每次访问 INSERT 新行，COUNT 统计）|
| visitors | 去重表（fp/item_id/action），配合 track() RPC 原子操作 |
| scores | 扫雷排行榜（仅 hard 模式）|
| page_views | 旧版页面计数器（已弃用）|

## 当前阶段
v1.2 稳定运行 ✅

## 阶段历史

### 阶段 1：基础框架（已完成）
- 用户端浏览/搜索/提交/点赞/复制
- 管理后台登录/审核
- Supabase RLS 权限配置

### 阶段 2：统计系统升级（已完成 2026-07-14）
- track() RPC 函数：服务端去重 + 原子递增 views/likes
- page_visits 表：每次访问 INSERT 新行，COUNT 统计绕过 1000 行限制
- visitors 表：浏览器指纹去重
- hourly_stats 物化视图：预聚合小时级数据
- 管理后台 5 分钟自动刷新

### 阶段 3：UI 升级（已完成）
- 深色主题（#0A0A0F 纯黑背景）
- 流星背景动画
- 图表：柱状图(渐变色+Y轴+悬浮提示)、饼图(图例+百分比)、折线图(24h/7天切换)
- 分享码横条布局 + 分页(15条/页)
- 反馈功能
- 手机端适配

## 已做决策
| 决策 | 理由 |
|------|------|
| Supabase anon key 放前端 | 公开设计，RLS 控制权限 |
| 服务端去重 | localStorage 清缓存就失效 |
| 页面访问用 MAX(id) | 绕过 Supabase 默认 1000 行限制 |
| 管理后台 5 分钟自动刷新 | 图表数据随时间更新 |
| 纯 Canvas 图表无第三方库 | 减少依赖 |

## 遇到的错误
| 错误 | 尝试次数 | 解决方案 |
|------|---------|---------|
| sbApi 函数声明覆盖 window.sbApi 导致递归 | 2 | 改用 const 表达式不覆盖全局 |
| 204 空响应 JSON 解析失败 | 2 | 检查 res.status === 204 返回 [] |
| Supabase 默认 1000 行限制 | 3 | MAX(id) 代替 COUNT |
| GitHub token 嵌入代码被吊销 | 1 | 改 Supabase |
| setTimeout 缺少 async 导致语法错误 | 1 | 添加 async 关键字 |
| doLike 函数多余 } 导致脚本崩溃 | 1 | 删除多余括号 |
| tooltip fixed 定位偏移 | 2 | absolute + 柱子坐标换算 |
