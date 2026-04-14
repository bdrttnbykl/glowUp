update public.appointments
set phone = case
  when phone is null or btrim(phone) = '' then phone
  when regexp_replace(phone, '\D', '', 'g') ~ '^\d{10}$'
    then '0' || regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^0\d{10}$'
    then regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^90\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  when regexp_replace(phone, '\D', '', 'g') ~ '^090\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  else phone
end
where phone is not null;

update public.customers
set phone = case
  when phone is null or btrim(phone) = '' then phone
  when regexp_replace(phone, '\D', '', 'g') ~ '^\d{10}$'
    then '0' || regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^0\d{10}$'
    then regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^90\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  when regexp_replace(phone, '\D', '', 'g') ~ '^090\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  else phone
end
where phone is not null;

update public.package_sales
set phone = case
  when phone is null or btrim(phone) = '' then phone
  when regexp_replace(phone, '\D', '', 'g') ~ '^\d{10}$'
    then '0' || regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^0\d{10}$'
    then regexp_replace(phone, '\D', '', 'g')
  when regexp_replace(phone, '\D', '', 'g') ~ '^90\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  when regexp_replace(phone, '\D', '', 'g') ~ '^090\d{10}$'
    then '0' || right(regexp_replace(phone, '\D', '', 'g'), 10)
  else phone
end
where phone is not null;
