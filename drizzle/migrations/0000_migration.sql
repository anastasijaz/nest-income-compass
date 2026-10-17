
create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  name text not null,
  address text not null default '',
  property_type text not null default 'apartment',
  monthly_rent numeric(12,2) not null default 0,
  tenants int not null default 0,
  photo_path text,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.properties to authenticated;
grant all on public.properties to service_role;
alter table public.properties enable row level security;
create policy "own properties" on public.properties for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.recurring_rents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  amount numeric(12,2) not null,
  day_of_month int not null default 1 check (day_of_month between 1 and 28),
  start_date date not null,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.recurring_rents to authenticated;
grant all on public.recurring_rents to service_role;
alter table public.recurring_rents enable row level security;
create policy "own recurring" on public.recurring_rents for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.fixes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  title text not null,
  description text,
  photo_path text,
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  estimated_cost numeric(12,2),
  status text not null default 'todo' check (status in ('todo','done')),
  actual_cost numeric(12,2),
  completed_at date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.fixes to authenticated;
grant all on public.fixes to service_role;
alter table public.fixes enable row level security;
create policy "own fixes" on public.fixes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.taxes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  tax_type text not null default 'grundsteuer',
  label text,
  amount numeric(12,2) not null,
  due_date date not null,
  status text not null default 'unpaid' check (status in ('paid','unpaid')),
  paid_at date,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.taxes to authenticated;
grant all on public.taxes to service_role;
alter table public.taxes enable row level security;
create policy "own taxes" on public.taxes for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  kind text not null check (kind in ('income','cost')),
  amount numeric(12,2) not null check (amount >= 0),
  date date not null default current_date,
  category text not null,
  vendor text,
  note text,
  receipt_path text,
  recurring_id uuid references public.recurring_rents(id) on delete set null,
  fix_id uuid references public.fixes(id) on delete set null,
  tax_id uuid references public.taxes(id) on delete set null,
  created_at timestamptz not null default now()
);
create unique index transactions_recurring_month on public.transactions (recurring_id, date) where recurring_id is not null;
create index transactions_property_date on public.transactions (property_id, date);
grant select, insert, update, delete on public.transactions to authenticated;
grant all on public.transactions to service_role;
alter table public.transactions enable row level security;
create policy "own transactions" on public.transactions for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Idempotently create missing monthly rent rows for the calling user up to today.
create or replace function public.generate_recurring_rent()
returns int language plpgsql security invoker set search_path = public as $$
declare r record; d date; n int := 0;
begin
  for r in select * from public.recurring_rents where user_id = auth.uid() and active loop
    d := (date_trunc('month', r.start_date) + (r.day_of_month - 1) * interval '1 day')::date;
    if d < r.start_date then d := (d + interval '1 month')::date; end if;
    while d <= current_date loop
      insert into public.transactions (user_id, property_id, kind, amount, date, category, note, recurring_id)
      values (r.user_id, r.property_id, 'income', r.amount, d, 'rent', coalesce(r.note, 'Monthly rent'), r.id)
      on conflict do nothing;
      if found then n := n + 1; end if;
      d := (d + interval '1 month')::date;
    end loop;
  end loop;
  return n;
end $$;
grant execute on function public.generate_recurring_rent() to authenticated;
