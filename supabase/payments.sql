-- ═══════════════════════════════════════════════════════════
-- MOVIES AI — ระบบชำระเงิน / สมาชิก VIP (ข้อ 9)
-- รันไฟล์นี้ใน Supabase Dashboard → SQL Editor (แล้วกด Run)
-- หมายเหตุ: ยังไม่ได้เลือกผู้ให้บริการชำระเงิน (Stripe/Omise ฯลฯ)
-- โครงสร้างนี้เป็นแบบทั่วไป รอเชื่อม provider + webhook secret
-- ═══════════════════════════════════════════════════════════

-- ตารางบันทึกการชำระเงินทุกรายการ (เขียนโดย server เท่านั้น ผ่าน webhook)
create table if not exists public.payments (
    id           uuid primary key default gen_random_uuid(),
    user_id      uuid not null references auth.users (id) on delete cascade,
    provider     text not null default 'pending',     -- เช่น stripe / omise / promptpay
    provider_ref text unique,                          -- reference จาก provider (กันซ้ำ)
    amount       numeric(10, 2) not null,
    currency     text not null default 'THB',
    status       text not null default 'pending',     -- pending / succeeded / failed
    plan         text not null default 'monthly',     -- monthly / yearly
    created_at   timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "payments readable by owner" on public.payments;
create policy "payments readable by owner"
    on public.payments
    for select
    using (auth.uid() = user_id);
-- ไม่เปิด insert/update ให้ client — webhook ใช้ service_role (ผ่าน RLS)

-- ตารางสมาชิก (app ใช้อยู่แล้ว — สร้างถ้ายังไม่มี / เติมคอลัมน์ถ้ามีแล้ว)
create table if not exists public.subscriptions (
    user_id            uuid primary key references auth.users (id) on delete cascade,
    status             text not null default 'inactive',   -- active / inactive / expired
    plan               text,
    current_period_end timestamptz,
    updated_at         timestamptz not null default now()
);

alter table public.subscriptions add column if not exists plan text;
alter table public.subscriptions add column if not exists current_period_end timestamptz;

alter table public.subscriptions enable row level security;

drop policy if exists "subscriptions readable by owner" on public.subscriptions;
create policy "subscriptions readable by owner"
    on public.subscriptions
    for select
    using (auth.uid() = user_id);
-- ไม่เปิด insert/update ให้ client — activate ผ่าน webhook (service_role) เท่านั้น

-- ═══════════════════════════════════════════════════════════
-- ฟังก์ชัน activate subscription เมื่อจ่ายเงินสำเร็จ
-- security definer + revoke จาก public: เรียกได้เฉพาะ service_role
-- (webhook route จะเรียกผ่าน service_role key หลังตรวจ signature แล้ว)
-- ═══════════════════════════════════════════════════════════
create or replace function public.activate_subscription(
    p_user_id uuid,
    p_provider text,
    p_provider_ref text,
    p_amount numeric,
    p_currency text default 'THB',
    p_plan text default 'monthly',
    p_period_days int default 30
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    -- บันทึก payment (idempotent ต่อ provider_ref)
    insert into public.payments (user_id, provider, provider_ref, amount, currency, status, plan)
    values (p_user_id, p_provider, p_provider_ref, p_amount, p_currency, 'succeeded', p_plan)
    on conflict (provider_ref) do nothing;

    -- เปิดสมาชิก VIP ตามระยะเวลา (ต่ออายุจากวันหมดอายุเดิมถ้ายังไม่หมด)
    insert into public.subscriptions (user_id, status, plan, current_period_end, updated_at)
    values (
        p_user_id,
        'active',
        p_plan,
        now() + make_interval(days => p_period_days),
        now()
    )
    on conflict (user_id) do update
        set status             = 'active',
            plan               = excluded.plan,
            current_period_end = case
                when public.subscriptions.current_period_end is not null
                     and public.subscriptions.current_period_end > now()
                then public.subscriptions.current_period_end + make_interval(days => p_period_days)
                else now() + make_interval(days => p_period_days)
            end,
            updated_at         = now();
end;
$$;

revoke execute on function public.activate_subscription(uuid, text, text, numeric, text, text, int) from anon, authenticated;
