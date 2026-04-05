alter table public.products
  add column if not exists transaction_type text,
  add column if not exists counterparty text;
