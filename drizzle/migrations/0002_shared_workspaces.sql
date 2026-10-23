create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our properties',
  invite_code text not null unique default upper(substr(md5(gen_random_uuid()::text), 1, 8)),
  created_at timestamptz not null default now()
);
grant select, update on public.workspaces to authenticated;
grant all on public.workspaces to service_role;
alter table public.workspaces enable row level security;

create table public.workspace_members (
  user_id uuid primary key,
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  display_name text not null default '',
  joined_at timestamptz not null default now()
);
grant select, update on public.workspace_members to authenticated;
grant all on public.workspace_members to service_role;
alter table public.workspace_members enable row level security;

create or replace function public.my_workspace_id()
returns uuid language sql stable security definer set search_path = public as $$
  select workspace_id from public.workspace_members where user_id = auth.uid()
$$;
grant execute on function public.my_workspace_id() to authenticated;

create policy "members read workspace" on public.workspaces for select to authenticated using (id = public.my_workspace_id());
create policy "members rename workspace" on public.workspaces for update to authenticated using (id = public.my_workspace_id()) with check (id = public.my_workspace_id());
create policy "members read members" on public.workspace_members for select to authenticated using (workspace_id = public.my_workspace_id());
create policy "edit own name" on public.workspace_members for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid() and workspace_id = public.my_workspace_id());

-- Backfill: one workspace per existing user
do $$
declare u uuid; w uuid;
begin
  for u in
    select user_id from public.properties union select user_id from public.transactions
    union select user_id from public.fixes union select user_id from public.taxes union select user_id from public.recurring_rents
  loop
    insert into public.workspaces default values returning id into w;
    insert into public.workspace_members (user_id, workspace_id, display_name)
      values (u, w, coalesce((select split_part(email, '@', 1) from auth.users where id = u), ''));
  end loop;
end $$;

alter table public.properties add column workspace_id uuid default public.my_workspace_id();
alter table public.transactions add column workspace_id uuid default public.my_workspace_id();
alter table public.fixes add column workspace_id uuid default public.my_workspace_id();
alter table public.taxes add column workspace_id uuid default public.my_workspace_id();
alter table public.recurring_rents add column workspace_id uuid default public.my_workspace_id();

update public.properties t set workspace_id = m.workspace_id from public.workspace_members m where m.user_id = t.user_id;
update public.transactions t set workspace_id = m.workspace_id from public.workspace_members m where m.user_id = t.user_id;
update public.fixes t set workspace_id = m.workspace_id from public.workspace_members m where m.user_id = t.user_id;
update public.taxes t set workspace_id = m.workspace_id from public.workspace_members m where m.user_id = t.user_id;
update public.recurring_rents t set workspace_id = m.workspace_id from public.workspace_members m where m.user_id = t.user_id;

-- Task assignment / completion, expense payer
alter table public.fixes add column assigned_to uuid;
alter table public.fixes add column completed_by uuid;
alter table public.transactions add column paid_by uuid;
update public.fixes set completed_by = user_id where status = 'done';
update public.transactions set paid_by = user_id where kind = 'cost';

drop policy "own properties" on public.properties;
drop policy "own transactions" on public.transactions;
drop policy "own fixes" on public.fixes;
drop policy "own taxes" on public.taxes;
drop policy "own recurring" on public.recurring_rents;
create policy "workspace properties" on public.properties for all to authenticated using (workspace_id = public.my_workspace_id()) with check (workspace_id = public.my_workspace_id());
create policy "workspace transactions" on public.transactions for all to authenticated using (workspace_id = public.my_workspace_id()) with check (workspace_id = public.my_workspace_id());
create policy "workspace fixes" on public.fixes for all to authenticated using (workspace_id = public.my_workspace_id()) with check (workspace_id = public.my_workspace_id());
create policy "workspace taxes" on public.taxes for all to authenticated using (workspace_id = public.my_workspace_id()) with check (workspace_id = public.my_workspace_id());
create policy "workspace recurring" on public.recurring_rents for all to authenticated using (workspace_id = public.my_workspace_id()) with check (workspace_id = public.my_workspace_id());

-- Visits calendar
create table public.visits (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null default public.my_workspace_id(),
  user_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  start_date date not null,
  end_date date not null,
  created_at timestamptz not null default now(),
  check (end_date >= start_date)
);
grant select, insert, update, delete on public.visits to authenticated;
grant all on public.visits to service_role;
alter table public.visits enable row level security;
create policy "workspace visits" on public.visits for all to authenticated using (workspace_id = public.my_workspace_id()) with check (workspace_id = public.my_workspace_id());

-- Make sure the caller has a workspace
create or replace function public.ensure_workspace()
returns uuid language plpgsql security definer set search_path = public as $$
declare w uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select workspace_id into w from public.workspace_members where user_id = auth.uid();
  if w is null then
    insert into public.workspaces default values returning id into w;
    insert into public.workspace_members (user_id, workspace_id, display_name)
      values (auth.uid(), w, coalesce((select split_part(email, '@', 1) from auth.users where id = auth.uid()), ''));
  end if;
  return w;
end $$;
grant execute on function public.ensure_workspace() to authenticated;

-- Join another group by invite code; your own data comes along
create or replace function public.join_workspace(_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare w uuid; old uuid;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select id into w from public.workspaces where invite_code = upper(trim(_code));
  if w is null then raise exception 'Invite code not found'; end if;
  select workspace_id into old from public.workspace_members where user_id = auth.uid();
  if old = w then return w; end if;
  if old is null then
    insert into public.workspace_members (user_id, workspace_id, display_name)
      values (auth.uid(), w, coalesce((select split_part(email, '@', 1) from auth.users where id = auth.uid()), ''));
  else
    update public.workspace_members set workspace_id = w, joined_at = now() where user_id = auth.uid();
    update public.properties set workspace_id = w where workspace_id = old and user_id = auth.uid();
    update public.transactions set workspace_id = w where workspace_id = old and user_id = auth.uid();
    update public.fixes set workspace_id = w where workspace_id = old and user_id = auth.uid();
    update public.taxes set workspace_id = w where workspace_id = old and user_id = auth.uid();
    update public.recurring_rents set workspace_id = w where workspace_id = old and user_id = auth.uid();
    update public.visits set workspace_id = w where workspace_id = old and user_id = auth.uid();
    if not exists (select 1 from public.workspace_members where workspace_id = old) then
      delete from public.workspaces where id = old;
    end if;
  end if;
  return w;
end $$;
grant execute on function public.join_workspace(text) to authenticated;

create or replace function public.generate_recurring_rent()
returns int language plpgsql security invoker set search_path = public as $$
declare r record; d date; n int := 0;
begin
  for r in select * from public.recurring_rents where workspace_id = public.my_workspace_id() and active loop
    d := (date_trunc('month', r.start_date) + (r.day_of_month - 1) * interval '1 day')::date;
    if d < r.start_date then d := (d + interval '1 month')::date; end if;
    while d <= current_date loop
      insert into public.transactions (user_id, workspace_id, property_id, kind, amount, date, category, note, recurring_id)
      values (r.user_id, r.workspace_id, r.property_id, 'income', r.amount, d, 'rent', coalesce(r.note, 'Monthly rent'), r.id)
      on conflict do nothing;
      if found then n := n + 1; end if;
      d := (d + interval '1 month')::date;
    end loop;
  end loop;
  return n;
end $$;

-- Let group members see each other's photos/receipts
create or replace function public.shares_workspace(_folder text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.workspace_members where user_id::text = _folder and workspace_id = public.my_workspace_id())
$$;
grant execute on function public.shares_workspace(text) to authenticated;
create policy "workspace files select" on storage.objects for select to authenticated using (bucket_id = 'files' and public.shares_workspace((storage.foldername(name))[1]));