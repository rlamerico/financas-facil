-- Bootstrap de perfil: cria a linha em public.profiles quando um usuário
-- se cadastra em auth.users. O primeiro usuário do sistema vira "admin"
-- (dono da conta); os demais entram como "user".
--
-- SECURITY DEFINER é o padrão oficial do Supabase para esse caso (a função
-- precisa de privilégios para inserir em public.profiles a partir de um
-- trigger em auth.users, fora do contexto RLS do usuário recém-criado).
-- Toda função SECURITY DEFINER em public é chamável publicamente por
-- padrão — por isso revogamos EXECUTE de PUBLIC/anon/authenticated logo
-- abaixo, deixando-a invocável apenas pelo trigger.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  is_first_user boolean;
begin
  select not exists (select 1 from public.profiles) into is_first_user;
  insert into public.profiles (user_id, full_name, role)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    case when is_first_user then 'admin' else 'user' end
  );
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
