alter table public.products
  add column if not exists item_type text;

update public.products
set item_type = 'Urun'
where item_type is null;

alter table public.products
  alter column item_type set default 'Urun';

alter table public.products
  alter column item_type set not null;

create index if not exists products_item_type_idx
  on public.products (item_type);
