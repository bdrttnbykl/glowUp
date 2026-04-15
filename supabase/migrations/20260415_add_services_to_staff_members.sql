alter table public.staff_members
add column if not exists services text[] not null default '{}';

update public.staff_members
set services = case name
  when 'Cagdas Akkaya' then array['Ayak Bakimi', 'Pedikur', 'Cilt Bakimi']
  when 'Sengul Sener' then array['Ayak Bakimi', 'Manikur', 'Kalici Oje', 'Cilt Bakimi']
  when 'Leyla Yusufoglu' then array['El Bakimi', 'Manikur', 'Kalici Oje', 'Nail Art']
  when 'Kazim Cikit' then array['El Bakimi', 'Pedikur', 'Kalici Oje', 'Nail Art']
  else services
end
where coalesce(array_length(services, 1), 0) = 0;
