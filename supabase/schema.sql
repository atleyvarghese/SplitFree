-- Enable UUID extension
create extension if not exists "pgcrypto";

-- Profiles (extends auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default now()
);

-- Groups
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  default_currency text default 'USD',
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now()
);

-- Group Members
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text default 'member' check (role in ('admin', 'member')),
  joined_at timestamp with time zone default now(),
  unique(group_id, user_id)
);

-- Expenses
create table public.expenses (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade,
  description text not null,
  amount decimal(10,2) not null check (amount > 0),
  currency text default 'USD',
  paid_by uuid references public.profiles(id) not null,
  split_type text not null check (split_type in ('equal', 'percentage', 'exact', 'shares')),
  date date default current_date,
  notes text,
  created_by uuid references public.profiles(id) not null,
  created_at timestamp with time zone default now()
);

-- Expense Splits
create table public.expense_splits (
  id uuid default gen_random_uuid() primary key,
  expense_id uuid references public.expenses(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  amount decimal(10,2) not null,
  settled boolean default false,
  settled_at timestamp with time zone
);

-- Settlements
create table public.settlements (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade,
  paid_by uuid references public.profiles(id) not null,
  paid_to uuid references public.profiles(id) not null,
  amount decimal(10,2) not null check (amount > 0),
  currency text default 'USD',
  notes text,
  created_at timestamp with time zone default now()
);

-- Group Invitations
create table public.group_invitations (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade,
  email text not null,
  invited_by uuid references public.profiles(id),
  token text unique default encode(gen_random_bytes(32), 'hex'),
  accepted boolean default false,
  created_at timestamp with time zone default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements enable row level security;
alter table public.group_invitations enable row level security;

-- Profiles: users can read all profiles, update their own
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select to authenticated using (true);

create policy "Users can update own profile"
  on public.profiles for update to authenticated using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- Groups: members can view, creators can manage
create policy "Group members can view groups"
  on public.groups for select to authenticated
  using (created_by = auth.uid() or public.is_group_member(id));

create policy "Authenticated users can create groups"
  on public.groups for insert to authenticated with check (created_by = auth.uid());

create policy "Group admins can update groups"
  on public.groups for update to authenticated
  using (public.is_group_admin(id));

create policy "Group admins can delete groups"
  on public.groups for delete to authenticated
  using (created_by = auth.uid());

-- Helpers: check membership/admin without triggering RLS (avoids infinite recursion)
create or replace function public.is_group_member(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function public.is_group_admin(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and user_id = auth.uid() and role = 'admin'
  );
$$;

-- Group Members
create policy "Members can view group members"
  on public.group_members for select to authenticated
  using (public.is_group_member(group_id));

create policy "Group admins can manage members"
  on public.group_members for insert to authenticated
  with check (public.is_group_admin(group_id) or user_id = auth.uid());

create policy "Users can leave groups"
  on public.group_members for delete to authenticated
  using (user_id = auth.uid() or public.is_group_admin(group_id));

-- Expenses
create policy "Group members can view expenses"
  on public.expenses for select to authenticated
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));

create policy "Group members can create expenses"
  on public.expenses for insert to authenticated
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid())
    and created_by = auth.uid());

create policy "Expense creators and group admins can update expenses"
  on public.expenses for update to authenticated
  using (created_by = auth.uid() or
    group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin'));

create policy "Expense creators and group admins can delete expenses"
  on public.expenses for delete to authenticated
  using (created_by = auth.uid() or
    group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin'));

-- Expense Splits
create policy "Group members can view splits"
  on public.expense_splits for select to authenticated
  using (expense_id in (
    select e.id from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where gm.user_id = auth.uid()
  ));

create policy "Group members can manage splits"
  on public.expense_splits for insert to authenticated
  with check (expense_id in (
    select e.id from public.expenses e
    join public.group_members gm on gm.group_id = e.group_id
    where gm.user_id = auth.uid()
  ));

create policy "Expense creator can update splits"
  on public.expense_splits for update to authenticated
  using (expense_id in (select id from public.expenses where created_by = auth.uid()));

create policy "Expense creator can delete splits"
  on public.expense_splits for delete to authenticated
  using (expense_id in (select id from public.expenses where created_by = auth.uid()));

-- Settlements
create policy "Group members can view settlements"
  on public.settlements for select to authenticated
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));

create policy "Group members can create settlements"
  on public.settlements for insert to authenticated
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid())
    and paid_by = auth.uid());

-- Invitations
create policy "Invited users can view their invitations"
  on public.group_invitations for select to authenticated
  using (email = (select email from public.profiles where id = auth.uid())
    or group_id in (select group_id from public.group_members where user_id = auth.uid()));

create policy "Group admins can create invitations"
  on public.group_invitations for insert to authenticated
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
    or group_id in (select id from public.groups where created_by = auth.uid()));

create policy "Group admins can update invitations"
  on public.group_invitations for update to authenticated
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- ============================================================
-- Trigger: auto-create profile on signup
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Realtime: enable for key tables
-- ============================================================
alter publication supabase_realtime add table public.expenses;
alter publication supabase_realtime add table public.expense_splits;
alter publication supabase_realtime add table public.settlements;
alter publication supabase_realtime add table public.group_members;
