-- SunnyPlast: Allow user name as user_code, preserve casing, and use @sunnyplast.com

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assigned_code text;
begin
  if (coalesce(new.raw_user_meta_data->>'role', 'user') = 'user') then
    assigned_code := coalesce(
      new.raw_user_meta_data->>'user_code',
      case
        when new.email like '%@sunnyplast.com' and new.email not like '%+%' then replace(new.email, '@sunnyplast.com', '')
        when new.email like '%@gmail.com' and new.email not like '%+%' then replace(new.email, '@gmail.com', '')
        else public.next_user_code()
      end
    );
  else
    assigned_code := coalesce(new.raw_user_meta_data->>'user_code', null);
  end if;

  insert into public.profiles (id, email, full_name, role, user_code)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case
      when new.raw_user_meta_data->>'role' = 'admin' then 'admin'
      else 'user'
    end,
    assigned_code
  )
  on conflict (id) do update set
    user_code = coalesce(public.profiles.user_code, excluded.user_code),
    email = excluded.email;
  return new;
end;
$$;
