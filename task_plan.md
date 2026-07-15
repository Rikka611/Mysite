# 任务计划：Mysite / BSide Olivia Lin 分享码平台

## 当前版本
v3.0.7 — 卡片模式上线 + 安全加固 + 全面评估修复

## 目标
为 BSide Olivia Lin（米哈游 AI 钢琴陪伴应用）构建粉丝分享码社区平台。

## 已完成阶段

### 阶段 1：基础框架 ✅
用户端浏览/搜索/提交/点赞/复制，管理后台登录/审核，Supabase RLS

### 阶段 2：安全加固 ✅
- P0 全封堵：INSERT status 绕过、PATCH/DELETE 权限、srKey 泄露、PW_HASH 移除
- RLS 开启：feedbacks + page_visits
- Edge Function 鉴权：所有写操作走服务端
- INSERT 限流：每分钟最多 10 条
- Admin 密码 sessionStorage（关标签即失效）
- 2FA TOTP 双重验证

### 阶段 3：UI 升级 ✅
- 暗色主题 + 星空流星背景 + 玻璃态卡片
- Canvas 图表（柱状/饼图/折线）+ 24h/7d/30d/全部 时间维度
- 标签分布饼图 + 图表联动列表筛选
- 分类系统 7 大类 + 关键词匹配

### 阶段 4：UX 增强 ✅
- 卡片/列表双视图滑块切换 + 瀑布流网格
- 双列列表模式 + 简介展示
- 搜索防抖 + 分类筛选
- 页码跳转输入框
- 分页自适应列数整数倍

### 阶段 5：安全审计修复（2026-07-16）✅
- prefers-reduced-motion 抑制 JS 动画（流星/火花/光晕/3D倾斜）
- iOS overscroll-behavior:none
- Admin 编辑/回复中跳过自动刷新
- Admin 错误信息去技术细节
- Admin 反馈仅未回复筛选
- 卡片不透明度提升（暗 0.05→0.08，亮 0.38→0.45）+ blur 6→10px
- Escape 关闭弹窗
- row role="button" + aria-label
- 弹窗 role="dialog" aria-modal
- focus-visible 全局样式
- \<main\> 语义地标
- Footer 更新时间

## 待完成

### 阶段 6：搜索 + 预览
| 任务 | 状态 |
|------|------|
| 搜索支持 pg_trgm 模糊匹配 | pending |
| 提交分享码前预览 | pending |

### 阶段 7：Admin 功能增强
| 任务 | 状态 |
|------|------|
| Admin 操作日志记录 | pending |
| Admin CSV 导出 | pending |
| 移动端适配（顶栏按钮换行、统计卡片、图表单列）| in_progress |

### 阶段 8：视觉打磨
| 任务 | 状态 |
|------|------|
| 日文字体栈（Noto Sans JP）| pending |
| 渐变文字 WCAG AA 对比度 4.5:1 | pending |

### 阶段 9：架构/合规
| 任务 | 状态 |
|------|------|
| 隐私政策页面 | pending |
| 自动化测试（vitest）| pending |
| 用户数据删除权 | pending |
