-- ============================================================
-- 安全修复 v4.2.1（在 Supabase SQL Editor 执行一次）
-- 1) discussions 匿名 UPDATE 收紧：只能改 likes/reports/name
-- 2) requests 匿名 UPDATE 收紧：只能 votes +1
-- 3) code_edits 改走 get_pending_edits RPC，撤销 anon 直读
-- 4) submit_token 列级撤销 anon SELECT（防令牌泄漏）
-- 5) 清理安全审查探测数据
-- ============================================================

-- ── 0) 撤销 anon 对 linli_codes.submit_token 的列级读取 ──────────
revoke select (submit_token) on public.linli_codes from anon;

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

-- ── 4) 清理安全审查探测数据 ──────────────────────────────────────
delete from public.page_visits where page='__probe__';
delete from public.visitors where fp='__track_probe_1';
