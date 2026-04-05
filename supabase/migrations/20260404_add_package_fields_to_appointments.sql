alter table public.appointments
add column if not exists package_sale_id bigint references public.package_sales (id) on delete set null,
add column if not exists package_session_number integer,
add column if not exists package_session_consumed_at timestamptz;

create index if not exists appointments_package_sale_id_idx
  on public.appointments (package_sale_id);
