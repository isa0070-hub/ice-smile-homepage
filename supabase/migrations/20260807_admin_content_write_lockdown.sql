-- 관리자 콘텐츠 쓰기는 서명된 관리자 세션을 확인하는 Next.js 서버 API와
-- SUPABASE_SECRET_KEY(service_role)를 통해서만 수행한다.
-- 기존 공개 페이지의 읽기는 유지하되 anon/authenticated 직접 쓰기 권한은 제거한다.

begin;

alter table if exists public.branches enable row level security;
alter table if exists public.notices enable row level security;
alter table if exists public.popup_notices enable row level security;
alter table if exists public.repair_cases enable row level security;
alter table if exists public.repair_case_images enable row level security;
alter table if exists public.gm_morning_notes enable row level security;

revoke insert, update, delete on table public.branches from public, anon, authenticated;
revoke insert, update, delete on table public.notices from public, anon, authenticated;
revoke insert, update, delete on table public.popup_notices from public, anon, authenticated;
revoke insert, update, delete on table public.repair_cases from public, anon, authenticated;
revoke insert, update, delete on table public.repair_case_images from public, anon, authenticated;
revoke select, insert, update, delete on table public.gm_morning_notes from public, anon, authenticated;

grant select on table public.branches to anon, authenticated;
grant select on table public.notices to anon, authenticated;
grant select on table public.popup_notices to anon, authenticated;
grant select on table public.repair_cases to anon, authenticated;
grant select on table public.repair_case_images to anon, authenticated;

-- 조회수는 공개 브라우저가 DB를 직접 수정하지 않는다. 페이지 조회 통계는
-- GA4와 서버 광고 방문 로그에서 확인하며 콘텐츠 테이블은 완전히 읽기 전용이다.
revoke update (views) on table public.repair_cases from public, anon, authenticated;

grant select, insert, update, delete on table public.branches to service_role;
grant select, insert, update, delete on table public.notices to service_role;
grant select, insert, update, delete on table public.popup_notices to service_role;
grant select, insert, update, delete on table public.repair_cases to service_role;
grant select, insert, update, delete on table public.repair_case_images to service_role;
grant select, insert, update, delete on table public.gm_morning_notes to service_role;

drop policy if exists "public_read_active_branches" on public.branches;
drop policy if exists "public_read_branches" on public.branches;
create policy "public_read_branches"
on public.branches
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_notices" on public.notices;
create policy "public_read_notices"
on public.notices
for select
to anon, authenticated
using (true);

drop policy if exists "public_read_active_popups" on public.popup_notices;
create policy "public_read_active_popups"
on public.popup_notices
for select
to anon, authenticated
using (is_active is true);

drop policy if exists "public_read_repair_cases" on public.repair_cases;
create policy "public_read_repair_cases"
on public.repair_cases
for select
to anon, authenticated
using (true);

drop policy if exists "public_update_repair_case_views" on public.repair_cases;

drop policy if exists "public_read_repair_case_images" on public.repair_case_images;
create policy "public_read_repair_case_images"
on public.repair_case_images
for select
to anon, authenticated
using (true);

commit;

-- Storage의 popup-images / repair-images 버킷은 별도 storage.objects 정책으로
-- anon/authenticated INSERT를 허용하지 않는지 Supabase 대시보드에서도 확인한다.
