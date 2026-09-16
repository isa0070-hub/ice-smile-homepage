-- Lock down legacy public-schema tables flagged by the Supabase Security Advisor.
-- Public clients may read only active homepage popup notices. All other access
-- is restricted to the server-side service role.

begin;

alter table public.homepage_notices enable row level security;
alter table public.contacts enable row level security;
alter table public.admins enable row level security;
alter table public.inventory_audit enable row level security;

do $policies$
declare
  target_table text;
  policy_row record;
begin
  foreach target_table in array array[
    'homepage_notices',
    'contacts',
    'admins',
    'inventory_audit'
  ]
  loop
    for policy_row in
      select policyname
      from pg_policies
      where schemaname = 'public'
        and tablename = target_table
    loop
      execute format(
        'drop policy if exists %I on public.%I',
        policy_row.policyname,
        target_table
      );
    end loop;
  end loop;
end
$policies$;

revoke all privileges on table public.homepage_notices
  from public, anon, authenticated;
revoke all privileges on table public.contacts
  from public, anon, authenticated;
revoke all privileges on table public.admins
  from public, anon, authenticated;
revoke all privileges on table public.inventory_audit
  from public, anon, authenticated;

grant select on table public.homepage_notices to anon, authenticated;

create policy "public_read_active_homepage_notices"
on public.homepage_notices
for select
to anon, authenticated
using (is_active is true and is_popup is true);

grant select, insert, update, delete on table public.homepage_notices
  to service_role;
grant select, insert, update, delete on table public.contacts
  to service_role;
grant select, insert, update, delete on table public.admins
  to service_role;
grant select, insert, update, delete on table public.inventory_audit
  to service_role;

commit;
