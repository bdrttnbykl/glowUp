alter table public.products
add column if not exists appointment_id bigint references public.appointments (id) on delete set null;

create index if not exists products_appointment_id_idx
  on public.products (appointment_id);
