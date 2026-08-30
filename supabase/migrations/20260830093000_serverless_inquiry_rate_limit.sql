-- Apply this migration before deploying the matching application code.
-- The public inquiry API calls the RPC with the server-only service-role key.

begin;

create schema if not exists private;

create table if not exists private.online_inquiry_rate_limits (
  scope text not null check (scope in ('global', 'ip')),
  key_hash text not null,
  window_started_at timestamptz not null,
  reset_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  primary key (scope, key_hash)
);

comment on table private.online_inquiry_rate_limits is
  'Short-lived counters for the public online inquiry endpoint. IP addresses are HMACed by the application before reaching this table.';

create index if not exists online_inquiry_rate_limits_reset_at_idx
  on private.online_inquiry_rate_limits (reset_at);

alter table private.online_inquiry_rate_limits enable row level security;

revoke all privileges on table private.online_inquiry_rate_limits
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant select, insert, update, delete
  on table private.online_inquiry_rate_limits to service_role;

create or replace function public.consume_online_inquiry_rate_limit(
  p_ip_hash text
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_global_count integer;
  v_global_reset timestamptz;
  v_ip_count integer;
  v_ip_reset timestamptz;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid inquiry rate-limit key'
      using errcode = '22023';
  end if;

  -- Expired counters no longer participate in decisions. They are removed
  -- on the next valid inquiry attempt, so the table cannot grow by window.
  delete from private.online_inquiry_rate_limits
  where reset_at <= v_now;

  -- Reserve a global slot first. Requests rejected by the per-IP limit give
  -- the slot back below, while a global rejection creates no new IP row.
  insert into private.online_inquiry_rate_limits as limits (
    scope,
    key_hash,
    window_started_at,
    reset_at,
    request_count
  )
  values (
    'global',
    'online-inquiries',
    v_now,
    v_now + interval '60 seconds',
    1
  )
  on conflict (scope, key_hash) do update
  set
    window_started_at = case
      when limits.reset_at <= v_now then v_now
      else limits.window_started_at
    end,
    reset_at = case
      when limits.reset_at <= v_now then v_now + interval '60 seconds'
      else limits.reset_at
    end,
    request_count = case
      when limits.reset_at <= v_now then 1
      else least(limits.request_count + 1, 31)
    end
  returning request_count, reset_at
  into v_global_count, v_global_reset;

  if v_global_count > 30 then
    allowed := false;
    retry_after := greatest(
      1,
      ceil(extract(epoch from (v_global_reset - v_now)))::integer
    );
    return next;
    return;
  end if;

  insert into private.online_inquiry_rate_limits as limits (
    scope,
    key_hash,
    window_started_at,
    reset_at,
    request_count
  )
  values (
    'ip',
    p_ip_hash,
    v_now,
    v_now + interval '10 minutes',
    1
  )
  on conflict (scope, key_hash) do update
  set
    window_started_at = case
      when limits.reset_at <= v_now then v_now
      else limits.window_started_at
    end,
    reset_at = case
      when limits.reset_at <= v_now then v_now + interval '10 minutes'
      else limits.reset_at
    end,
    request_count = case
      when limits.reset_at <= v_now then 1
      else least(limits.request_count + 1, 6)
    end
  returning request_count, reset_at
  into v_ip_count, v_ip_reset;

  if v_ip_count > 5 then
    update private.online_inquiry_rate_limits
    set request_count = greatest(request_count - 1, 0)
    where scope = 'global'
      and key_hash = 'online-inquiries'
      and reset_at = v_global_reset;

    allowed := false;
    retry_after := greatest(
      1,
      ceil(extract(epoch from (v_ip_reset - v_now)))::integer
    );
    return next;
    return;
  end if;

  allowed := true;
  retry_after := 0;
  return next;
end;
$function$;

comment on function public.consume_online_inquiry_rate_limit(text) is
  'Atomically enforces 5 valid inquiry attempts per IP hash per 10 minutes and 30 valid attempts globally per minute.';

revoke execute on function public.consume_online_inquiry_rate_limit(text)
  from public, anon, authenticated;
grant execute on function public.consume_online_inquiry_rate_limit(text)
  to service_role;

commit;
