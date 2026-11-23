-- schema.sql 適用済みのプロジェクトで実行します。再実行できます。
begin;

create schema if not exists ledger_private;
revoke all on schema ledger_private from public, anon, authenticated;
grant usage on schema ledger_private to authenticated;

-- auth.mfa_factors の直接参照権限は渡しません。
-- 自分の確認済みの認証方法の有無だけでアクセス可否を判定します。
create or replace function ledger_private.mfa_allows_access()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    coalesce((select auth.jwt()->>'aal') = 'aal2', false)
    or not exists (
      select 1
      from auth.mfa_factors
      where user_id = (select auth.uid())
        and status = 'verified'
    )
  );
$$;

revoke all on function ledger_private.mfa_allows_access() from public, anon, authenticated;
grant execute on function ledger_private.mfa_allows_access() to authenticated;

-- 既存の所有者ポリシーに加えて、確認済みの認証方法があれば AAL2 を要求します。
drop policy if exists accounts_require_verified_mfa on public.accounts;
create policy accounts_require_verified_mfa on public.accounts
as restrictive for all to authenticated
using ((select ledger_private.mfa_allows_access()))
with check ((select ledger_private.mfa_allows_access()));

drop policy if exists settings_require_verified_mfa on public.user_settings;
create policy settings_require_verified_mfa on public.user_settings
as restrictive for all to authenticated
using ((select ledger_private.mfa_allows_access()))
with check ((select ledger_private.mfa_allows_access()));

-- 設定画面は、データ保護の準備が済んでから新規登録を案内します。
create or replace function public.ledger_mfa_available()
returns boolean
language sql
stable
set search_path = ''
as $$
  select true;
$$;
revoke all on function public.ledger_mfa_available() from public, anon, authenticated;
grant execute on function public.ledger_mfa_available() to authenticated;

notify pgrst, 'reload schema';
commit;
