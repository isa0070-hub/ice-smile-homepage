-- Apply this migration before deploying the matching application code.
-- The new API writes submission_token on every public inquiry.

begin;

alter table public.online_inquiries
  add column if not exists submission_token uuid;

comment on column public.online_inquiries.submission_token is
  'Browser-generated idempotency key used to prevent duplicate submissions.';

create unique index if not exists online_inquiries_submission_token_key
  on public.online_inquiries (submission_token);

alter table public.online_inquiries enable row level security;

-- Remove any legacy permissive policies before making this table server-only.
do $policies$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'online_inquiries'
  loop
    execute format(
      'drop policy if exists %I on public.online_inquiries',
      policy_row.policyname
    );
  end loop;
end
$policies$;

revoke all privileges on table public.online_inquiries from anon, authenticated;

-- The server-only Supabase client uses the service-role key. Service role
-- bypasses RLS, and this explicit grant keeps its CRUD access unambiguous.
grant select, insert, update, delete on table public.online_inquiries to service_role;

commit;
