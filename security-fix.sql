-- ============================================================
-- 安全修复 v4.2.1（在 Supabase SQL Editor 执行一次）
-- 1) discussions 匿名 UPDATE 收紧：只能改 likes/reports/name
-- 2) requests 匿名 UPDATE 收紧：只能 votes +1
-- 3) code_edits 改走 get_pending_edits RPC，撤销 anon 直读
-- 4) submit_token 列级撤销 anon SELECT（防令牌泄漏）
-- 5) 清理安全审查探测数据
-- ============================================================

-- ── 0) 撤销 anon 对 linli_codes.submit_token 的读取 ──────────────
-- 注：列级 REVOKE 盖不过表级 GRANT SELECT，需先撤表级再按列重授
revoke select on public.linli_codes from anon;
grant select (id, code, title, description, author, tags, views, likes, status, created_at, reports)
  on public.linli_codes to anon;

-- ── 1) discussions：删除所有现存 UPDATE 策略，重建受限策略 ────────
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname='public' and tablename='discussions' and cmd='UPDATE'
  loop
    execute format('drop policy %I on public.discussions', p.policyname);
  end loop;
end $$;

create policy "discussions_anon_update_limited" on public.discussions
  for update to anon
  using (true)
  with check (
    is_admin = false
    and pinned = false
    and content = (select d.content from public.discussions d where d.id = discussions.id)
    and title is not distinct from (select d.title from public.discussions d where d.id = discussions.id)
    and parent_id is not distinct from (select d.parent_id from public.discussions d where d.id = discussions.id)
    and likes between (select d.likes from public.discussions d where d.id = discussions.id) - 1
                  and (select d.likes from public.discussions d where d.id = discussions.id) + 1
    and reports between (select d.reports from public.discussions d where d.id = discussions.id)
                  and (select d.reports from public.discussions d where d.id = discussions.id) + 1
  );

-- ── 2) requests：删除所有现存 UPDATE 策略，重建 votes-only ────────
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname='public' and tablename='requests' and cmd='UPDATE'
  loop
    execute format('drop policy %I on public.requests', p.policyname);
  end loop;
end $$;

create policy "requests_anon_update_votes" on public.requests
  for update to anon
  using (true)
  with check (
    votes = (select r.votes from public.requests r where r.id = requests.id) + 1
    and status = (select r.status from public.requests r where r.id = requests.id)
    and title = (select r.title from public.requests r where r.id = requests.id)
    and note is not distinct from (select r.note from public.requests r where r.id = requests.id)
  );

-- ── 3) 编辑审核队列：改走 SECURITY DEFINER RPC，撤销 anon 直读 ────
revoke select on public.code_edits from anon;

create or replace function public.get_pending_edits()
returns table (
  id bigint,
  code_id bigint,
  old_title text, old_tags text, old_code text,
  new_title text, new_tags text, new_code text,
  reason text, status text, created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select id, code_id, old_title, old_tags, old_code,
         new_title, new_tags, new_code, reason, status, created_at
  from public.code_edits
  where status = 'pending'
  order by created_at desc
  limit 100;
$$;

grant execute on function public.get_pending_edits to anon;

-- ── 3a) apply_edit / reject_edit 越权修复：加管理员令牌校验 ────────
-- 此前二函数仅凭 edit_id 即可生效（SECURITY DEFINER 无鉴权），匿名者可自提编辑→自批通过。
-- 现要求 p_admin 匹配 admin_config.admin_token 才放行。
create or replace function public.apply_edit(edit_id bigint, p_admin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  ed record;
begin
  if (select value from public.admin_config where key='admin_token') is distinct from p_admin then
    raise exception 'unauthorized';
  end if;
  select * into ed from public.code_edits where id = edit_id;
  if ed.id is null then return; end if;
  update public.linli_codes set title = ed.new_title, tags = ed.new_tags, code = ed.new_code where id = ed.code_id;
  update public.code_edits set status = 'applied' where id = edit_id;
end;
$$;

create or replace function public.reject_edit(edit_id bigint, p_admin text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select value from public.admin_config where key='admin_token') is distinct from p_admin then
    raise exception 'unauthorized';
  end if;
  update public.code_edits set status = 'rejected' where id = edit_id;
end;
$$;

grant execute on function public.apply_edit(bigint, text) to anon;
grant execute on function public.reject_edit(bigint, text) to anon;

-- ── 3b) discussions 缺失列 DDL 补齐（title 仅线上手工加过，防全新环境失败）──
alter table public.discussions add column if not exists title text;

-- ── 4) 清理安全审查探测数据 ──────────────────────────────────────
delete from public.page_visits where page='__probe__';
delete from public.visitors where fp='__track_probe_1';
