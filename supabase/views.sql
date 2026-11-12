-- ═══════════════════════════════════════════════════════════
-- MOVIES AI — ระบบนับยอดวิว (view_count)
-- รันไฟล์นี้ใน Supabase Dashboard → SQL Editor (แล้วกด Run)
-- ทำงาน: สร้างตาราง view_counts + ฟังก์ชัน record_view + RLS
-- ═══════════════════════════════════════════════════════════

-- ตารางนับยอดวิวต่อเรื่อง (1 แถวต่อเรื่อง)
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

-- ฟังก์ชันบันทึกยอดวิว: แทรกถ้ายังไม่มี / บวกเพิ่มถ้ามีแล้ว
-- security definer เพื่อให้ anon บันทึกได้โดยไม่ต้องเปิด insert กว้าง
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
