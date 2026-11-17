-- ═══════════════════════════════════════════════════════════════════
-- MOVIES AI — SQL Views (Wave 2 ข้อ 4: ลดข้อมูลที่ดึง + episode_counts)
-- รันไฟล์นี้ใน Supabase Dashboard → SQL Editor → Run
--
-- หลักการออกแบบ:
--   1) view episode_counts — นับจำนวนตอนต่อเรื่องใน DB แทนการ fetch ทั้งตาราง
--   2) ลดการดึงข้อมูลจาก "ทุกแถว episodes" → "แค่ movie_id + count"
--   3) ไม่ต้องซิงค์เพิ่มเติม — view อัปเดตตามข้อมูลจริงอัตโนมัติ
--   4) ยังคงรักษา view_counts + record_view ไว้ (ไม่กระทบระบบยอดวิวเดิม)
-- ════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- ตารางนับยอดวิวต่อเรื่อง (1 แถวต่อเรื่อง) — รักษารูปแบบเดิม
-- ════════════════════════════════════════════════════════════════════
create table if not exists public.view_counts (
    movie_id   uuid primary key references public.movies (id) on delete cascade,
    views      bigint not null default 0,
    updated_at timestamptz not null default now()
);

-- RLS: ใครก็อ่านได้ (เป็นข้อมูลรวม ไม่มีข้อมูลส่วนตัว)
alter table public.view_counts enable row level security;

drop policy if exists "view_counts readable by everyone" on public.view_counts;
create policy "view_counts readable by everyone"
    on public.view_counts
    for select
    using (true);

-- ═══════════════════════════════════════════════════════════════════
-- view episode_counts — นับตอนต่อเรื่องในคำสั่งเดียว
-- (PostgreSQL ไม่รองรับ CREATE VIEW IF NOT EXISTS จึงตรวจผ่าน pg_views ใน DO block)
-- ═══════════════════════════════════════════════════════════════════
do $$
begin
  if not exists (
    select 1 from pg_views
    where schemaname = 'public' and viewname = 'episode_counts'
  ) then
    create view public.episode_counts as
    select movie_id, count(*) as episode_count
    from public.episodes
    where is_published = true
    group by movie_id;
  end if;
end $$;

grant select on public.episode_counts to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- ฟังก์ชันบันทึกยอดวิว: แทรกถ้ายังไม่มี / บวกเพิ่มถ้ามีแล้ว
-- security definer เพื่อให้ anon บันทึกได้โดยไม่ต้องเปิด insert กว้าง
-- ═══════════════════════════════════════════════════════════════════
create or replace function public.record_view(p_movie_id uuid)
returns bigint
language sql
security definer
set search_path = public
as $$
    insert into public.view_counts (movie_id, views)
    values (p_movie_id, 1)
    on conflict (movie_id) do update
        set views      = public.view_counts.views + 1,
            updated_at = now()
    returning public.view_counts.views;
$$;

-- ให้ anon และ user ที่ล็อกอินเรียกฟังก์ชันได้
grant execute on function public.record_view(uuid) to anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════
-- หลังรันเสร็จ — ตรวจผลลัพธ์:
--   select * from episode_counts limit 5;
--
-- ใช้งานใน lib/data.ts:
--   const { data } = await supabase.from('episode_counts').select('movie_id, episode_count');
--   → ได้ Record<string, number> ในคำขอเดียว (แทน fetch ทั้งตาราง)
-- ═══════════════════════════════════════════════════════════════════