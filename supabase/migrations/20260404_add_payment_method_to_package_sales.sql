alter table public.package_sales
add column if not exists payment_method text;

update public.package_sales
set payment_method = 'Nakit'
where payment_method is null;

alter table public.package_sales
alter column payment_method set default 'Nakit';
