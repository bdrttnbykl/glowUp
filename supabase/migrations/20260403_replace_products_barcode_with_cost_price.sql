alter table public.products
  add column if not exists cost_price text;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'barcode'
  ) then
    update public.products
    set cost_price = barcode
    where cost_price is null
      and barcode is not null;

    alter table public.products
      drop column if exists barcode;
  end if;
end $$;
