-- SupabaseのSQL Editorで全文を実行してください。
-- 既存の台帳データを削除せず、同じ内容を再実行できます。
begin;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  service_name text not null check (char_length(btrim(service_name)) between 1 and 200),
  login_url text not null default '' check (char_length(login_url) <= 2048 and (login_url = '' or login_url ~* '^https?://')),
  login_id text not null default '' check (char_length(login_id) <= 500),
  registered_email text not null default '' check (char_length(registered_email) <= 320),
  storage_location text not null default '' check (char_length(storage_location) <= 100),
  storage_item text not null default '' check (char_length(storage_item) <= 500),
  two_factor text not null default '' check (char_length(two_factor) <= 100),
  category text not null default '' check (char_length(category) <= 100),
  status text not null default '利用中' check (char_length(status) <= 100),
  billing text not null default '無料' check (char_length(billing) <= 100),
  last_reviewed_on date,
  notes text not null default '' check (char_length(notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists accounts_owner_created_idx on public.accounts (user_id, created_at desc, id);

create table if not exists public.user_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  options jsonb not null default '{}'::jsonb check (jsonb_typeof(options) = 'object'),
  updated_at timestamptz not null default now()
);

create or replace function public.set_ledger_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_ledger_updated_at() from public, anon, authenticated;

drop trigger if exists accounts_updated_at on public.accounts;
create trigger accounts_updated_at before update on public.accounts
for each row execute function public.set_ledger_updated_at();

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings
for each row execute function public.set_ledger_updated_at();

-- 自動RLSがOFFでも、必要なテーブルには明示的に設定します。
alter table public.accounts enable row level security;
alter table public.user_settings enable row level security;

drop policy if exists accounts_select_own on public.accounts;
create policy accounts_select_own on public.accounts for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists accounts_insert_own on public.accounts;
create policy accounts_insert_own on public.accounts for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists accounts_update_own on public.accounts;
create policy accounts_update_own on public.accounts for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists accounts_delete_own on public.accounts;
create policy accounts_delete_own on public.accounts for delete to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists settings_select_own on public.user_settings;
create policy settings_select_own on public.user_settings for select to authenticated
using ((select auth.uid()) = user_id);

drop policy if exists settings_insert_own on public.user_settings;
create policy settings_insert_own on public.user_settings for insert to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists settings_update_own on public.user_settings;
create policy settings_update_own on public.user_settings for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists settings_delete_own on public.user_settings;
create policy settings_delete_own on public.user_settings for delete to authenticated
using ((select auth.uid()) = user_id);

-- 「Automatically expose new tables」がOFFでも動くよう、必要な権限だけ付けます。
revoke all on table public.accounts, public.user_settings from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.accounts, public.user_settings to authenticated;

commit;
