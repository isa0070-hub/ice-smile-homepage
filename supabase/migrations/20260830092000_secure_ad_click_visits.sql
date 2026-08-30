-- Apply this migration before deploying the matching application code.
-- Public browsers write through /api/ad-click/visit; direct anon access is denied.

begin;

alter table public.ad_click_visits
  add column if not exists click_fingerprint text;

comment on column public.ad_click_visits.click_fingerprint is
  'SHA-256 idempotency fingerprint for one paid-ad click or browser session.';

do $constraints$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ad_click_visits_click_fingerprint_format'
      and conrelid = 'public.ad_click_visits'::regclass
  ) then
    alter table public.ad_click_visits
      add constraint ad_click_visits_click_fingerprint_format
      check (
        click_fingerprint is null
        or click_fingerprint ~ '^[0-9a-f]{64}$'
      );
  end if;
end
$constraints$;

create unique index if not exists ad_click_visits_click_fingerprint_key
  on public.ad_click_visits (click_fingerprint)
  where click_fingerprint is not null;

create index if not exists ad_click_visits_clicked_at_idx
  on public.ad_click_visits (clicked_at desc);

create index if not exists ad_click_visits_ip_clicked_at_idx
  on public.ad_click_visits (ip_address, clicked_at desc)
  where ip_address is not null;

create index if not exists ad_click_visits_visitor_clicked_at_idx
  on public.ad_click_visits (visitor_id, clicked_at desc)
  where visitor_id is not null;

alter table public.ad_click_visits enable row level security;

do $policies$
declare
  policy_row record;
begin
  for policy_row in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'ad_click_visits'
  loop
    execute format(
      'drop policy if exists %I on public.ad_click_visits',
      policy_row.policyname
    );
  end loop;
end
$policies$;

revoke all privileges on table public.ad_click_visits
  from public, anon, authenticated;

grant select, insert, update, delete on table public.ad_click_visits
  to service_role;

create schema if not exists private;

revoke usage on schema private from public, anon, authenticated;
grant usage on schema private to service_role;

create table if not exists private.ad_click_rate_limits (
  scope text not null,
  subject_hash text not null,
  window_started_at timestamptz not null,
  request_count integer not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint ad_click_rate_limits_pkey
    primary key (scope, subject_hash),
  constraint ad_click_rate_limits_scope_check
    check (scope in ('ip_10m', 'ip_1h', 'visitor_24h')),
  constraint ad_click_rate_limits_subject_hash_format
    check (
      pg_catalog.length(subject_hash) = 64
      and subject_hash ~ '^[0-9a-f]{64}$'
    ),
  constraint ad_click_rate_limits_request_count_check
    check (request_count between 1 and 101),
  constraint ad_click_rate_limits_expiry_check
    check (expires_at > window_started_at)
);

create index if not exists ad_click_rate_limits_expires_at_idx
  on private.ad_click_rate_limits (expires_at);

comment on table private.ad_click_rate_limits is
  'Saturated UTC-aligned fixed-window counters for paid-ad API attempts.';

alter table private.ad_click_rate_limits enable row level security;

revoke all privileges on table private.ad_click_rate_limits
  from public, anon, authenticated;

grant select, insert, update, delete
  on table private.ad_click_rate_limits
  to service_role;

create or replace function public.consume_ad_click_rate_limit(
  p_ip_hash text,
  p_visitor_hash text
)
returns table (
  allowed boolean,
  retry_after integer
)
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_now timestamptz := clock_timestamp();
  v_anchor timestamptz := timestamptz '2001-01-01 00:00:00+00';
  v_ip_10m_started_at timestamptz;
  v_ip_1h_started_at timestamptz;
  v_visitor_24h_started_at timestamptz;
  v_ip_10m_expires_at timestamptz;
  v_ip_1h_expires_at timestamptz;
  v_visitor_24h_expires_at timestamptz;
  v_ip_10m_count integer;
  v_ip_1h_count integer;
  v_visitor_24h_count integer;
begin
  if p_ip_hash is null
    or pg_catalog.length(p_ip_hash) <> 64
    or p_ip_hash !~ '^[0-9a-f]{64}$'
    or p_visitor_hash is null
    or pg_catalog.length(p_visitor_hash) <> 64
    or p_visitor_hash !~ '^[0-9a-f]{64}$'
  then
    raise exception using
      errcode = '22023',
      message = 'Rate-limit subject hashes must be lowercase SHA-256 hex.';
  end if;

  v_ip_10m_started_at := pg_catalog.date_bin(
    interval '10 minutes',
    v_now,
    v_anchor
  );
  v_ip_1h_started_at := pg_catalog.date_bin(
    interval '1 hour',
    v_now,
    v_anchor
  );
  v_visitor_24h_started_at := pg_catalog.date_bin(
    interval '24 hours',
    v_now,
    v_anchor
  );
  v_ip_10m_expires_at := v_ip_10m_started_at + interval '10 minutes';
  v_ip_1h_expires_at := v_ip_1h_started_at + interval '1 hour';
  v_visitor_24h_expires_at :=
    v_visitor_24h_started_at + interval '24 hours';

  insert into private.ad_click_rate_limits as limits (
    scope,
    subject_hash,
    window_started_at,
    request_count,
    expires_at,
    updated_at
  )
  values (
    'ip_10m',
    p_ip_hash,
    v_ip_10m_started_at,
    1,
    v_ip_10m_expires_at,
    v_now
  )
  on conflict (scope, subject_hash) do update
  set window_started_at = excluded.window_started_at,
      request_count = case
        when limits.window_started_at = excluded.window_started_at
          then least(limits.request_count + 1, 31)
        else 1
      end,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
  returning limits.request_count
    into v_ip_10m_count;

  insert into private.ad_click_rate_limits as limits (
    scope,
    subject_hash,
    window_started_at,
    request_count,
    expires_at,
    updated_at
  )
  values (
    'ip_1h',
    p_ip_hash,
    v_ip_1h_started_at,
    1,
    v_ip_1h_expires_at,
    v_now
  )
  on conflict (scope, subject_hash) do update
  set window_started_at = excluded.window_started_at,
      request_count = case
        when limits.window_started_at = excluded.window_started_at
          then least(limits.request_count + 1, 101)
        else 1
      end,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at
  returning limits.request_count
    into v_ip_1h_count;

  -- Once either IP bucket is blocked, do not create a new visitor bucket.
  -- This prevents rejected traffic from growing the table by rotating IDs.
  if v_ip_10m_count <= 30 and v_ip_1h_count <= 100 then
    insert into private.ad_click_rate_limits as limits (
      scope,
      subject_hash,
      window_started_at,
      request_count,
      expires_at,
      updated_at
    )
    values (
      'visitor_24h',
      p_visitor_hash,
      v_visitor_24h_started_at,
      1,
      v_visitor_24h_expires_at,
      v_now
    )
    on conflict (scope, subject_hash) do update
    set window_started_at = excluded.window_started_at,
        request_count = case
          when limits.window_started_at = excluded.window_started_at
            then least(limits.request_count + 1, 21)
          else 1
        end,
        expires_at = excluded.expires_at,
        updated_at = excluded.updated_at
    returning limits.request_count
      into v_visitor_24h_count;
  else
    v_visitor_24h_count := 0;
  end if;

  allowed := v_ip_10m_count <= 30
    and v_ip_1h_count <= 100
    and v_visitor_24h_count <= 20;

  if allowed then
    retry_after := 0;
  else
    retry_after := greatest(
      case
        when v_ip_10m_count > 30 then greatest(
          1,
          pg_catalog.ceil(
            pg_catalog.date_part(
              'epoch',
              v_ip_10m_expires_at - v_now
            )
          )::integer
        )
        else 0
      end,
      case
        when v_ip_1h_count > 100 then greatest(
          1,
          pg_catalog.ceil(
            pg_catalog.date_part(
              'epoch',
              v_ip_1h_expires_at - v_now
            )
          )::integer
        )
        else 0
      end,
      case
        when v_visitor_24h_count > 20 then greatest(
          1,
          pg_catalog.ceil(
            pg_catalog.date_part(
              'epoch',
              v_visitor_24h_expires_at - v_now
            )
          )::integer
        )
        else 0
      end
    );
  end if;

  -- Clean up only after taking the rate-bucket locks in their fixed order.
  -- SKIP LOCKED keeps cleanup from waiting on another request's live buckets,
  -- while LIMIT bounds the work performed by any one API call.
  with expired_rows as (
    select limits.scope, limits.subject_hash
    from private.ad_click_rate_limits as limits
    where limits.expires_at <= v_now
    order by limits.expires_at, limits.scope, limits.subject_hash
    for update skip locked
    limit 256
  )
  delete from private.ad_click_rate_limits as limits
  using expired_rows
  where limits.scope = expired_rows.scope
    and limits.subject_hash = expired_rows.subject_hash
    and limits.expires_at <= v_now;

  return next;
end
$function$;

revoke all privileges
  on function public.consume_ad_click_rate_limit(text, text)
  from public, anon, authenticated;

grant execute
  on function public.consume_ad_click_rate_limit(text, text)
  to service_role;

comment on function public.consume_ad_click_rate_limit(text, text) is
  'Atomically consumes UTC-aligned 10m/1h IP and 24h visitor request '
  'attempt buckets; slots are consumed independently of visit insertion.';

commit;
