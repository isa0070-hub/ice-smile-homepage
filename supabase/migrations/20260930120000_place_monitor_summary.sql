begin;

create table if not exists public.place_monitor_measurements (
  measurement_id text primary key,
  sensor_id text not null check (sensor_id ~ '^[a-z0-9][a-z0-9-]{0,63}$'),
  query text not null check (char_length(query) between 1 and 120),
  result_surface text not null check (char_length(result_surface) between 1 and 64),
  measured_at timestamptz not null,
  measurement_status text not null check (measurement_status in (
    'VALID',
    'NOT_IN_OBSERVED_RANGE',
    'AUTO_PAN_DETECTED',
    'CONTEXT_CHANGED',
    'AMBIGUOUS_ENTITY',
    'UI_CHANGED',
    'CAPTCHA',
    'LOGIN_BLOCK',
    'MEASUREMENT_FAILED',
    'MANUAL_REVIEW_REQUIRED'
  )),
  observed_n smallint not null check (observed_n between 0 and 100),
  target_found boolean not null,
  organic_rank smallint check (organic_rank between 1 and 100),
  error_summary text check (error_summary is null or char_length(error_summary) <= 300),
  checkpoint text check (checkpoint is null or checkpoint in ('D1', 'D3', 'D4', 'D7')),
  experiment_id text check (experiment_id is null or char_length(experiment_id) <= 80),
  source_version text check (source_version is null or char_length(source_version) <= 32),
  search_conditions jsonb not null default '{}'::jsonb,
  synced_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint place_monitor_rank_matches_found check (
    (target_found and organic_rank is not null)
    or (not target_found and organic_rank is null)
  ),
  constraint place_monitor_conditions_small check (
    octet_length(search_conditions::text) <= 2048
  )
);

create index if not exists place_monitor_measured_at_idx
  on public.place_monitor_measurements (measured_at desc);

create index if not exists place_monitor_sensor_measured_idx
  on public.place_monitor_measurements (sensor_id, measured_at desc);

alter table public.place_monitor_measurements enable row level security;
revoke all on table public.place_monitor_measurements from anon, authenticated;
grant select, insert on table public.place_monitor_measurements to service_role;

create or replace view public.place_monitor_latest
with (security_invoker = true)
as
select distinct on (sensor_id)
  measurement_id,
  sensor_id,
  query,
  result_surface,
  measured_at,
  measurement_status,
  observed_n,
  target_found,
  organic_rank,
  error_summary,
  checkpoint,
  experiment_id,
  source_version,
  search_conditions,
  synced_at,
  created_at
from public.place_monitor_measurements
order by sensor_id, measured_at desc, created_at desc;

revoke all on table public.place_monitor_latest from anon, authenticated;
grant select on table public.place_monitor_latest to service_role;

create table if not exists public.place_monitor_sync_status (
  source_id text primary key,
  last_sync_at timestamptz not null,
  accepted_count smallint not null check (accepted_count between 0 and 25),
  stored_count smallint not null check (stored_count between 0 and accepted_count),
  updated_at timestamptz not null default now()
);

alter table public.place_monitor_sync_status enable row level security;
revoke all on table public.place_monitor_sync_status from anon, authenticated;
grant select, insert, update on table public.place_monitor_sync_status to service_role;

create table if not exists public.place_monitor_observer_status (
  source_id text primary key,
  source_version text check (source_version is null or char_length(source_version) <= 32),
  generated_at timestamptz not null,
  phase text check (phase is null or char_length(phase) <= 64),
  schedule_tasks jsonb not null default '[]'::jsonb,
  synced_at timestamptz not null default now(),
  constraint place_monitor_schedule_small check (
    octet_length(schedule_tasks::text) <= 12000
  )
);

alter table public.place_monitor_observer_status enable row level security;
revoke all on table public.place_monitor_observer_status from anon, authenticated;
grant select, insert, update on table public.place_monitor_observer_status to service_role;

comment on table public.place_monitor_measurements is
  'Small cloud summaries from the local v0.13 rank observer. HTML, screenshots, detailed logs, SQLite data, and browser profiles remain local.';

commit;
