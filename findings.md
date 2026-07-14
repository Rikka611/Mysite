# 研究发现：Mysite

## Supabase

### REST API 限制
- 默认每页 1000 行，超出需 `limit` 参数或 Range 头
- `Prefer: return=minimal` 返回 204，`return=representation` 返回插入行（受 RLS 限制）
- RPC 函数需 `GRANT EXECUTE TO anon` 才能从客户端调用
- 批量 POST 要求所有对象字段一致，否则 "All object keys must match"

### RLS 权限
- anon key 公开但安全，RLS 策略控制实际权限
- `GRANT INSERT/SELECT/UPDATE/DELETE ON table TO anon` 必须在 SQL 中显式声明
- 序列也需要 `GRANT USAGE ON SEQUENCE TO anon`
- CHECK 约束在 INSERT 时验证，需在 SQL 或客户端同时处理

### 函数声明陷阱
- `async function sbApi()` 在全局作用域声明会覆盖 `window.sbApi`
- 解决方案：改用 `const sbApi = async function()` 或保存引用 `const _api = window.sbApi`

## 前端

### HTML 转义
- 所有用户输入在嵌入 HTML 前必须 `esc()` 转义（XSS 防护）
- 分享码（字母数字）验证后仍应转义

### localStorage 去重
- 清缓存/换浏览器后失效
- 改用服务端 visitors 表 + PRIMARY KEY (fp, item_id, action) 去重

### Canvas 图表
- DPR 缩放：`canvas.width = w * dpr` 保持高清
- tooltip 用 `position:absolute` + 父容器 `position:relative` 定位最稳
- 中文字体 `system-ui` 或 `sans-serif` 兼容性最好

## 部署

### GitHub Pages
- 部署有 30-90 秒延迟
- 删除文件 + 新建目录可能缓存不一致，加空 commit 触发重建
- shared/ 目录下的 JS 文件被浏览器强缓存，更新后需 Ctrl+Shift+R

### 网络问题
- 本地 file:// 无法加载 shared JS（CORS）
- 需 `npx serve .` 启动本地服务器测试
- GitHub push 偶尔超时，重试即可
