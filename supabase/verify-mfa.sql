-- enable-ledger-mfa.sql の適用後に実行します。テスト用データはROLLBACKで破棄します。
begin;

insert into auth.users (id, email) values
  ('f83e87e5-f300-4b5f-8f66-eaba5f3dd301', 'ledger-mfa-check@example.invalid'),
  ('f83e87e5-f300-4b5f-8f66-eaba5f3dd302', 'ledger-mfa-other@example.invalid');
insert into public.accounts (user_id, service_name) values
  ('f83e87e5-f300-4b5f-8f66-eaba5f3dd301', 'MFA確認用A'),
  ('f83e87e5-f300-4b5f-8f66-eaba5f3dd302', 'MFA確認用B');
insert into public.user_settings (user_id) values
  ('f83e87e5-f300-4b5f-8f66-eaba5f3dd301'),
  ('f83e87e5-f300-4b5f-8f66-eaba5f3dd302');
insert into auth.mfa_factors (id, user_id, factor_type, status, created_at, updated_at)
values ('f83e87e5-f300-4b5f-8f66-eaba5f3dd303', 'f83e87e5-f300-4b5f-8f66-eaba5f3dd301',
  'totp', 'unverified', now(), now());

select set_config('request.jwt.claims', '{"sub":"f83e87e5-f300-4b5f-8f66-eaba5f3dd301","role":"authenticated","aal":"aal1"}', true);
select set_config('request.jwt.claim.sub', 'f83e87e5-f300-4b5f-8f66-eaba5f3dd301', true);
set local role authenticated;
do $$
begin
  if not public.ledger_mfa_available()
    or (select count(*) from public.accounts) <> 1
    or (select count(*) from public.user_settings) <> 1 then
    raise exception '登録途中の利用者が最初の要素で自分の台帳にアクセスできません';
  end if;
end;
$$;
reset role;

update auth.mfa_factors set status = 'verified'
where id = 'f83e87e5-f300-4b5f-8f66-eaba5f3dd303';
set local role authenticated;
do $$
declare statement text; affected integer;
begin
  if exists (select 1 from public.accounts) or exists (select 1 from public.user_settings) then
    raise exception '二つ目の要素を確認せず読み取れます';
  end if;
  foreach statement in array array[
    'update public.accounts set notes = ''拒否'' where user_id = auth.uid()',
    'delete from public.accounts where user_id = auth.uid()',
    'update public.user_settings set options = ''{}'' where user_id = auth.uid()',
    'delete from public.user_settings where user_id = auth.uid()'
  ] loop
    execute statement;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception '二つ目の要素を確認せず更新できます: %', statement; end if;
  end loop;
  foreach statement in array array[
    'insert into public.accounts (service_name) values (''拒否'')',
    'insert into public.user_settings (options) values (''{}'')'
  ] loop
    begin
      execute statement;
      raise exception '二つ目の要素を確認せず登録できます: %', statement;
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;
reset role;

select set_config('request.jwt.claims', '{"sub":"f83e87e5-f300-4b5f-8f66-eaba5f3dd301","role":"authenticated","aal":"aal2"}', true);
set local role authenticated;
do $$
declare affected integer;
begin
  if (select count(*) from public.accounts) <> 1 or (select count(*) from public.user_settings) <> 1 then
    raise exception '二つ目の要素を確認した利用者に自分のデータだけが表示されません';
  end if;
  update public.accounts set notes = '確認済み' where user_id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception '二つ目の要素を確認した利用者が台帳を更新できません'; end if;
  update public.user_settings set options = '{"category":["確認済み"]}' where user_id = auth.uid();
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception '二つ目の要素を確認した利用者が設定を更新できません'; end if;
end;
$$;
reset role;

rollback;
select 'PASS: 2段階認証の登録前・確認前・確認後のアクセスを確認しました。' as result;
