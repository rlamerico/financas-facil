-- Fase 8 (Perfil P11 + Configurações de Sistema P12 + RBAC fino).
--
-- Gap de RLS encontrado ao ler a policy atual de `profiles` (migration 002):
-- só existe policy de SELECT/UPDATE com `auth.uid() = user_id` (dono edita
-- só a si mesmo) — um admin não consegue enxergar nem promover/rebaixar
-- outro usuário pela tela de Configurações. `is_admin()` é o padrão oficial
-- do Supabase para esse caso: função SECURITY DEFINER que consulta
-- `profiles` fora do contexto de RLS da própria policy que a usa, evitando
-- a recursão infinita que aconteceria se a policy consultasse `profiles`
-- diretamente dentro de si mesma.

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where user_id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create policy "Admins can view all profiles" on profiles
  for select to authenticated
  using (is_admin());

create policy "Admins can update any profile" on profiles
  for update to authenticated
  using (is_admin())
  with check (is_admin());

-- Achado de segurança real durante a verificação desta fase: a policy de
-- dono ("Users can update own profile", migration 002) usa
-- `USING (auth.uid() = user_id)` sem checar QUAIS colunas estão sendo
-- alteradas — como não existe `WITH CHECK` restringindo o valor de `role`,
-- um usuário comum autenticado poderia rodar
-- `update profiles set role = 'admin' where user_id = auth.uid()` e se
-- auto-promover, contornando toda a UI de Configurações. Trigger
-- `BEFORE UPDATE` fecha esse gap: bloqueia qualquer mudança em `role` a
-- menos que quem está executando o UPDATE já seja admin (via `is_admin()`),
-- preservando a edição livre de `full_name`/`avatar_url` pelo dono.
create or replace function public.prevent_role_self_escalation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'Apenas administradores podem alterar o campo role.'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger enforce_role_change_admin_only
  before update on public.profiles
  for each row
  execute function public.prevent_role_self_escalation();

-- Storage: bucket público de avatars, cada usuário só escreve no próprio
-- path `{user_id}/*` (checado via `storage.foldername`); leitura pública
-- (bucket público) evita ter que assinar URL toda vez que a foto é exibida.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "Users can upload own avatar" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update own avatar" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete own avatar" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
