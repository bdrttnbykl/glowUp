alter table public.appointments
add column if not exists service_status text;

update public.appointments
set service_status = case
  when attendance_status = 'Geldi' then 'Yapildi'
  when attendance_status is null then null
  else 'Yapilmadi'
end
where service_status is null;
