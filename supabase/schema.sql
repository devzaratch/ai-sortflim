-- ═══════════════════════════════════════════════════════════════════════
-- MOVIES AI — RLS Hardening (Wave 1: ปิดช่องโหว่การเขียนข้อมูล)
-- รันไฟล์นี้ใน Supabase Dashboard → SQL Editor → Run
--
-- หลักการออกแบบ:
--   1) "อ่าน" ไม่ถูกแตะ — policy เดิมที่เปิดให้อ่านสาธารณะยังทำงาน
--   2) "เขียน" (insert/update/delete) ล็อกด้วย RESTRICTIVE policies
--      → แม้ตารางจะมี policy เดิมแบบหลวม ๆ อยู่ ก็ยังถูกจำกัดด้วยเงื่อนไขนี้
--   3) ใช้ security definer เฉพาะ helper ที่อ่านค่า role ของ "ตัวเอง"
--      (ไม่มีพารามิเตอร์ ไม่สามารถอ่าน role ของคนอื่นได้)
-- ═══════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────
-- 0) Helper: ผู้ใช้ปัจจุบันเป็นแอดมินหรือไม่
--    security definer เพื่ออ่าน profiles ได้โดยไม่ติด recursive RLS
--    ปลอดภัย: ไม่รับพารามิเตอร์ + ใช้ auth.uid() ภายในเท่านั้น
-- ─────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = (select auth.uid())
      and p.role = 'admin'
  );
$$;

grant execute on function public.is_admin() to anon, authenticated;

-- Helper: role ปัจจุบันของผู้ใช้ (ใช้ตรวจว่าไม่มีการแก้ role ตัวเอง)
create or replace function public.my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role from public.profiles p where p.id = (select auth.uid());
$$;

grant execute on function public.my_role() to authenticated;

-- ─────────────────────────────────────────────────────────
-- 1) movies — อ่านได้ทุกคน / เขียนเฉพาะแอดมิน
-- ─────────────────────────────────────────────────────────
alter table public.movies enable row level security;

drop policy if exists "movies_public_read" on public.movies;
create policy "movies_public_read" on public.movies
    for select
    to anon, authenticated
    using (true);

drop policy if exists "movies_insert_admin" on public.movies;
create policy "movies_insert_admin" on public.movies
    as restrictive
    for insert
    to anon, authenticated
    with check (public.is_admin());

drop policy if exists "movies_update_admin" on public.movies;
create policy "movies_update_admin" on public.movies
    as restrictive
    for update
    to anon, authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "movies_delete_admin" on public.movies;
create policy "movies_delete_admin" on public.movies
    as restrictive
    for delete
    to anon, authenticated
    using (public.is_admin());

-- ─────────────────────────────────────────────────────────
-- 2) episodes — อ่านได้ทุกคน / เขียนเฉพาะแอดมิน
-- ─────────────────────────────────────────────────────────
alter table public.episodes enable row level security;

drop policy if exists "episodes_public_read" on public.episodes;
create policy "episodes_public_read" on public.episodes
    for select
    to anon, authenticated
    using (true);

drop policy if exists "episodes_insert_admin" on public.episodes;
create policy "episodes_insert_admin" on public.episodes
    as restrictive
    for insert
    to anon, authenticated
    with check (public.is_admin());

drop policy if exists "episodes_update_admin" on public.episodes;
create policy "episodes_update_admin" on public.episodes
    as restrictive
    for update
    to anon, authenticated
    using (public.is_admin())
    with check (public.is_admin());

drop policy if exists "episodes_delete_admin" on public.episodes;
create policy "episodes_delete_admin" on public.episodes
    as restrictive
    for delete
    to anon, authenticated
    using (public.is_admin());

-- ─────────────────────────────────────────────────────────
-- 3) profiles — เห็นเฉพาะของตัวเอง (แอดมินเห็นได้) / ห้ามแก้ role ตัวเอง
-- ─────────────────────────────────────────────────────────
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin" on public.profiles
    for select
    to authenticated
    using ((select auth.uid()) = id or public.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
    as restrictive
    for insert
    to authenticated
    with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own_no_role_change" on public.profiles;
create policy "profiles_update_own_no_role_change" on public.profiles
    as restrictive
    for update
    to authenticated
    using ((select auth.uid()) = id or public.is_admin())
    with check (
        ((select auth.uid()) = id and role is not distinct from public.my_role())
        or public.is_admin()
    );

drop policy if exists "profiles_delete_admin" on public.profiles;
create policy "profiles_delete_admin" on public.profiles
    as restrictive
    for delete
    to authenticated
    using (public.is_admin());

-- ─────────────────────────────────────────────────────────
-- 4) watch_history — เจ้าของเท่านั้น (อ่าน/เขียน/ลบ)
-- ─────────────────────────────────────────────────────────
alter table public.watch_history enable row level security;

drop policy if exists "watch_history_select_own" on public.watch_history;
create policy "watch_history_select_own" on public.watch_history
    for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "watch_history_write_own" on public.watch_history;
create policy "watch_history_write_own" on public.watch_history
    as restrictive
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "watch_history_update_own" on public.watch_history;
create policy "watch_history_update_own" on public.watch_history
    as restrictive
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "watch_history_delete_own" on public.watch_history;
create policy "watch_history_delete_own" on public.watch_history
    as restrictive
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────
-- 5) comments — อ่านทุกคน / เขียนเฉพาะสมาชิก / แก้-ลบเฉพาะของตัวเอง
--    (ถ้ารัน comments.sql ไปแล้ว policy เดิมจะถูกแทนที่ด้วยชุดนี้)
-- ─────────────────────────────────────────────────────────
alter table public.comments enable row level security;

drop policy if exists "comments_select_all" on public.comments;
create policy "comments_select_all" on public.comments
    for select
    to anon, authenticated
    using (true);

drop policy if exists "comments_insert_auth" on public.comments;
create policy "comments_insert_auth" on public.comments
    as restrictive
    for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

drop policy if exists "comments_update_own" on public.comments;
create policy "comments_update_own" on public.comments
    as restrictive
    for update
    to authenticated
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

drop policy if exists "comments_delete_own" on public.comments;
create policy "comments_delete_own" on public.comments
    as restrictive
    for delete
    to authenticated
    using ((select auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────
-- 6) view_counts — อ่านทุกคน / เขียนเฉพาะผ่าน RPC record_view
--    (record_view เป็น security definer จึงยังบันทึกได้)
-- ─────────────────────────────────────────────────────────
alter table public.view_counts enable row level security;

drop policy if exists "view_counts_read_all" on public.view_counts;
create policy "view_counts_read_all" on public.view_counts
    for select
    to anon, authenticated
    using (true);

drop policy if exists "view_counts_write_admin" on public.view_counts;
create policy "view_counts_write_admin" on public.view_counts
    as restrictive
    for all
    to anon, authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ─────────────────────────────────────────────────────────
-- 7) subscriptions / payments — client เขียนไม่ได้เด็ดขาด
--    (webhook ใช้ service_role ซึ่ง bypass RLS อยู่แล้ว)
-- ─────────────────────────────────────────────────────────
alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions_deny_client_write" on public.subscriptions;
create policy "subscriptions_deny_client_write" on public.subscriptions
    as restrictive
    for all
    to anon, authenticated
    using (public.is_admin())
    with check (public.is_admin());

alter table public.payments enable row level security;

drop policy if exists "payments_deny_client_write" on public.payments;
create policy "payments_deny_client_write" on public.payments
    as restrictive
    for all
    to anon, authenticated
    using (public.is_admin())
    with check (public.is_admin());

-- ═══════════════════════════════════════════════════════════════════════
-- หลังรันเสร็จ — ตรวจผลลัพธ์:
--   1) select * from pg_policies where schemaname = 'public';
--   2) ลอง insert จากหน้าเว็บด้วยบัญชีที่ไม่ใช่แอดมิน → ต้องได้ error
--      "new row violates row-level security policy"
--   3) ตั้ง role แอดมินคนแรก:
--      update public.profiles set role = 'admin' where id = '<uuid ของคุณ>';
--      (รันผ่าน SQL Editor เท่านั้น — client แก้ role ตัวเองไม่ได้แล้ว)
-- ═══════════════════════════════════════════════════════════════════════
