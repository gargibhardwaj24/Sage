create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_name text;
begin
  resolved_name := coalesce(
    nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''),
    nullif(btrim(new.raw_user_meta_data ->> 'name'), ''),
    nullif(
      btrim(
        concat_ws(
          ' ',
          nullif(btrim(new.raw_user_meta_data ->> 'given_name'), ''),
          nullif(btrim(new.raw_user_meta_data ->> 'family_name'), '')
        )
      ),
      ''
    ),
    nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
    'there'
  );

  insert into public.profiles (id, display_name)
  values (new.id, resolved_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

update public.profiles p
set display_name = coalesce(
  nullif(btrim(u.raw_user_meta_data ->> 'full_name'), ''),
  nullif(btrim(u.raw_user_meta_data ->> 'name'), ''),
  nullif(
    btrim(
      concat_ws(
        ' ',
        nullif(btrim(u.raw_user_meta_data ->> 'given_name'), ''),
        nullif(btrim(u.raw_user_meta_data ->> 'family_name'), '')
      )
    ),
    ''
  ),
  p.display_name
)
from auth.users u
where u.id = p.id
  and (
    p.display_name = split_part(coalesce(u.email, ''), '@', 1)
    or p.display_name = 'there'
  );
