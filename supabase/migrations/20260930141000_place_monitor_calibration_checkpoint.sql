begin;

alter table public.place_monitor_measurements
  drop constraint if exists place_monitor_measurements_checkpoint_check;

alter table public.place_monitor_measurements
  add constraint place_monitor_measurements_checkpoint_check
  check (
    checkpoint is null
    or checkpoint in ('D1', 'D3', 'D4', 'D7')
    or checkpoint ~ '^CAL-[0-9]{8}-[0-9]{4}$'
  );

commit;
