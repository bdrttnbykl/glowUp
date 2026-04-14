alter table public.appointments
add column if not exists whatsapp_reminder_last_attempt_at timestamptz,
add column if not exists whatsapp_reminder_last_error text,
add column if not exists whatsapp_reminder_sent_at timestamptz,
add column if not exists whatsapp_reminder_sent_for_date date;

create index if not exists appointments_whatsapp_reminder_date_idx
  on public.appointments (date, whatsapp_reminder_sent_for_date);
