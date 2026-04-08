alter table public.products
add column if not exists quantity integer;

update public.products
set quantity = 1
where quantity is null
  and transaction_type = 'Satis';
