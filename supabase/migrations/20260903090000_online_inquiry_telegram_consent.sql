-- Apply this migration before deploying the matching application code.
-- It records the customer's separately submitted Telegram notification consent.

begin;

alter table public.online_inquiries
  add column if not exists telegram_consent boolean not null default false,
  add column if not exists telegram_consent_at timestamptz,
  add column if not exists privacy_notice_version text;

comment on column public.online_inquiries.telegram_consent is
  'Whether the customer submitted the Telegram notification consent.';

comment on column public.online_inquiries.telegram_consent_at is
  'Server timestamp recorded when Telegram notification consent was submitted.';

comment on column public.online_inquiries.privacy_notice_version is
  'Privacy notice version accepted for Telegram notification processing.';

do $constraint$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'online_inquiries_telegram_consent_evidence_check'
      and conrelid = 'public.online_inquiries'::regclass
  ) then
    alter table public.online_inquiries
      add constraint online_inquiries_telegram_consent_evidence_check
      check (
        not telegram_consent
        or (
          telegram_consent_at is not null
          and privacy_notice_version is not null
        )
      );
  end if;
end
$constraint$;

commit;
