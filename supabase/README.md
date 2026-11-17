# MOVIES AI — SQL สำหรับ Supabase

ไฟล์ทั้งหมดในโฟลเดอร์นี้รันผ่าน **Supabase Dashboard → SQL Editor → Run** (ใช้ `?query=...` ผ่าน REST ไม่ได้)
ไฟล์ทุกไฟล์ออกแบบให้ **รันซ้ำได้ (idempotent)** — รันกี่ครั้งก็ไม่พัง

## ลำดับการรัน (ครั้งแรกตั้งโครงใหม่)

| ลำดับ | ไฟล์ | ทำอะไร |
| --- | --- | --- |
| 1 | `schema.sql` | ตารางหลักทั้งหมด (ถ้ามีอยู่แล้วจะข้าม) + **RLS Hardening** |
| 2 | `views.sql` | view `episode_counts` + ตาราง `view_counts` + RPC `record_view` |
| 3 | `comments.sql` | ตารางคอมเมนต์/คะแนน + RLS |
| 4 | `payments.sql` | ตาราง `subscriptions` + RLS |

> ตอนนี้ (17 พ.ย. 2026) ทั้ง 4 ไฟล์ถูกรันครบแล้ว — จำเป็นต้องรันอีกเฉพาะเมื่อแก้ไฟล์ SQL

## ตาราง + View สรุป

```
movies          id, title, description, poster_url, created_at, genre (comma-separated), is_completed
episodes        id, movie_id, title, episode_number, access_level (free | early_access),
                free_released_at, stream_path, is_published, created_at
profiles        id (= auth.users.id), email, role, created_at, username
subscriptions   id, user_id, status (active = VIP), stripe_*, current_period_end, updated_at
watch_history   id, user_id, movie_id, last_ep, total_ep, updated_at
comments        id, user_id, movie_id, rating, body, created_at (ดู comments.sql)
view_counts     movie_id (PK), views, updated_at          ← ตาราง (views.sql)
episode_counts  movie_id, episode_count                    ← view (views.sql)
```

## RLS Hardening (`schema.sql`)

หลักการ:

1. **อ่าน** — policy เดิมที่เปิดให้อ่านสาธารณะยังทำงาน (anon key เห็นเฉพาะข้อมูลสาธารณะ)
2. **เขียน** (insert/update/delete) — ล็อกด้วย **RESTRICTIVE policies** → แม้มี policy เดิมแบบหลวมค้างอยู่ ก็ยังถูกจำกัดด้วยเงื่อนไขนี้
3. Helper `public.is_admin()` / `public.my_role()` เป็น **security definer ที่อ่าน `auth.uid()` ตัวเองเท่านั้น** — ไม่รับพารามิเตอร์ จึงอ่าน role ของคนอื่นไม่ได้ (กัน recursive RLS ด้วย)
4. `UPDATE` ใช้ทั้ง `USING` + `WITH CHECK` — กันการเปลี่ยน `role` ของตัวเองเป็น admin

### ตั้ง role แอดมินคนแรก (ทำครั้งเดียว)

หลังรัน `schema.sql` ให้เพิ่ม role ใน SQL Editor (แทน `<uuid>` ด้วย id ของผู้ใช้จาก `profiles`):

```sql
update public.profiles set role = 'admin' where id = '<uuid>';
```

ดู uuid ได้จาก: SQL Editor → `select id, email from public.profiles;`

### ยืนยันว่า RLS ทำงาน (จากเครื่องภายนอก)

```bash
# anon key ไม่มี session → ตาราง user-scoped ต้องตอบ 401/400 ไม่ใช่ส่งข้อมูลคนอื่นมา
curl -s "$SUPABASE_URL/rest/v1/watch_history?limit=1" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

## views.sql — รายละเอียด

- **`episode_counts`** — นับจำนวนตอนต่อเรื่อง (กรอง `is_published = true`) ใช้ทำ badge "N ตอน" + เรียง "ยอดนิยม"
  สร้างด้วย DO block เพราะ PostgreSQL **ไม่รองรับ** `CREATE VIEW IF NOT EXISTS` (error 42601)
- **`view_counts`** — ตารางนับยอดวิวต่อเรื่อง (1 แถวต่อเรื่อง) อ่านสาธารณะได้
- **`record_view(movie_id)`** — RPC บันทึกวิว 1 ครั้ง (มี throttle 6 ชม. ฝั่ง client ด้วย `localStorage: view_throttle`)

## หลังแก้ SQL — อัปเดตแคชฝั่งเว็บ

เว็บแคชข้อมูลผ่าน `'use cache'` (`lib/data-server.ts`) — หลังแก้ข้อมูล/โครงสร้างมาก ๆ
ถ้าหน้าเว็บยังโชว์ข้อมูลเก่า ให้ re-deploy หรือ revalidate tag ใน dashboard
