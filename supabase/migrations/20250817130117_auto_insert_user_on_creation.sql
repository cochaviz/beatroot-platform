-- Automatically insert a user into the profiles table when a new user is created.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Create a matching profile row with user_id, email, and full_name
  insert into public.profiles (user_id, email, full_name)
  values (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (user_id) do nothing;  -- idempotent
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();