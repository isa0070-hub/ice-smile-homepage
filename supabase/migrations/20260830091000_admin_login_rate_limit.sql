-- Apply this migration before deploying the matching application code.
-- Client IP addresses are HMAC-hashed in the server before reaching this table.

begin;

create table if not exists public.admin_login_rate_limits (
  rate_key text primary key,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  window_started_at timestamptz not null default clock_timestamp(),
  blocked_until timestamptz,
  updated_at timestamptz not null default clock_timestamp()
);

comment on table public.admin_login_rate_limits is
  'Server-only, durable brute-force protection for the administrator login.';

create index if not exists admin_login_rate_limits_updated_at_idx
  on public.admin_login_rate_limits (updated_at);

alter table public.admin_login_rate_limits enable row level security;

revoke all privileges on table public.admin_login_rate_limits
  from public, anon, authenticated;
grant select, insert, update, delete on table public.admin_login_rate_limits
  to service_role;

create or replace function public.consume_admin_login_rate_limit(
  p_rate_key text,
  p_max_attempts integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_attempt_count integer;
  v_window_started_at timestamptz;
  v_blocked_until timestamptz;
  v_retry_after integer;
begin
  if p_rate_key is null
    or char_length(p_rate_key) > 80
    or p_rate_key !~ '^ip:[0-9a-f]{64}$'
    or p_max_attempts is null
    or p_max_attempts < 1
    or p_max_attempts > 100
    or p_window_seconds is null
    or p_window_seconds < 60
    or p_window_seconds > 86400
    or p_block_seconds is null
    or p_block_seconds < 60
    or p_block_seconds > 86400
  then
    raise exception 'invalid admin login rate-limit parameters'
      using errcode = '22023';
  end if;

  delete from public.admin_login_rate_limits
  where updated_at < v_now - interval '7 days';

  insert into public.admin_login_rate_limits (
    rate_key,
    attempt_count,
    window_started_at,
    updated_at
  )
  values (p_rate_key, 0, v_now, v_now)
  on conflict (rate_key) do nothing;

  select attempt_count, window_started_at, blocked_until
  into v_attempt_count, v_window_started_at, v_blocked_until
  from public.admin_login_rate_limits
  where rate_key = p_rate_key
  for update;

  if v_blocked_until is not null and v_blocked_until > v_now then
    v_retry_after := greatest(
      1,
      ceil(extract(epoch from (v_blocked_until - v_now)))::integer
    );

    update public.admin_login_rate_limits
    set updated_at = v_now
    where rate_key = p_rate_key;

    return jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', v_retry_after
    );
  end if;

  if v_blocked_until is not null
    or v_window_started_at <= v_now - make_interval(secs => p_window_seconds)
  then
    v_attempt_count := 1;
    v_window_started_at := v_now;
    v_blocked_until := null;
  else
    v_attempt_count := v_attempt_count + 1;
  end if;

  if v_attempt_count > p_max_attempts then
    v_blocked_until := v_now + make_interval(secs => p_block_seconds);

    update public.admin_login_rate_limits
    set attempt_count = v_attempt_count,
        window_started_at = v_window_started_at,
        blocked_until = v_blocked_until,
        updated_at = v_now
    where rate_key = p_rate_key;

    return jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', p_block_seconds
    );
  end if;

  update public.admin_login_rate_limits
  set attempt_count = v_attempt_count,
      window_started_at = v_window_started_at,
      blocked_until = null,
      updated_at = v_now
  where rate_key = p_rate_key;

  return jsonb_build_object(
    'allowed', true,
    'retry_after_seconds', 0
  );
end;
$function$;

revoke all privileges on function public.consume_admin_login_rate_limit(
  text,
  integer,
  integer,
  integer
) from public, anon, authenticated;
grant execute on function public.consume_admin_login_rate_limit(
  text,
  integer,
  integer,
  integer
) to service_role;

commit;
