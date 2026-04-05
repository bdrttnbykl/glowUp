alter table public.appointments
add column if not exists attendance_status text,
add column if not exists payment_status text,
add column if not exists payment_method text,
add column if not exists collected_amount text,
add column if not exists closed_at timestamptz;

