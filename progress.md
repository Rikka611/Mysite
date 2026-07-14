# 进度日志：Mysite

## 会话：2026-07-14

### 统计系统升级
- **状态：** complete
- track() RPC 函数：一次性 INSERT visitors + 原子递增 views/likes
- page_visits 改用 COUNT(MAX id) 绕过 1000 行限制
- Supabase SQL：visitors 表 + track 函数 + hourly_stats 物化视图
- 管理后台 5 分钟自动刷新

### 点赞功能修复
- 回退到去掉数字版本（爱心变红，无计数）+ 保留 skipAnim + 修bug中文案
- 点赞显示 revert 到 ae0750c 版本

### 第二批数据导入
- 导入 27 条新分享码
- 已存在的重复码自动跳过

### 工具提示修复
- tooltip 定位从 fixed 回到 absolute，基于柱子坐标计算

## 会话：2026-07-13

### Linli 页面构建
- 用户端完整功能：热门/最新/搜索、分页(15条/页)、提交分享码、点赞(服务端去重)、复制、反馈
- 深色主题 #0A0A0F + 流星背景动画
- 管理后台：审核/批量操作/统计/图表/反馈管理

### 项目重构
- 公共模块提取 shared/js/ + shared/css/
- 配置文件分离 config.js（从 gitignore 移除）
- 清理 7 个测试文件

### 遇到的 bug
- sbApi 全局声明覆盖 window.sbApi → 递归 → 改用 const 表达式
- setTimeout 回调缺少 async → await 语法错误
- doLike 函数多余 } → 整个脚本失效
- Supabase 1000 行限制 → MAX(id) 替代方案
- tooltip position:fixed 定位偏移 → absolute + 坐标换算
