-- schema.sqlの実行後、SQL Editorで全文を実行します。
-- テスト用の2人を一時的に作り、最後にROLLBACKします。実データは残しません。
-- 途中でエラーが出た場合もROLLBACKを実行してから確認してください。
begin;

insert into auth.users (id, email) values
  ('8ba36409-1a31-48f8-a060-29e8283b1011', 'ledger-test-owner@example.invalid'),
  ('8ba36409-1a31-48f8-a060-29e8283b1022', 'ledger-test-other@example.invalid');

insert into public.accounts (id, user_id, service_name, updated_at) values
  ('a08dd898-e4ed-4984-9d8b-cd9992841011', '8ba36409-1a31-48f8-a060-29e8283b1011', 'RLS確認用A', '2000-01-01'),
  ('a08dd898-e4ed-4984-9d8b-cd9992841022', '8ba36409-1a31-48f8-a060-29e8283b1022', 'RLS確認用B', '2000-01-01');
insert into public.user_settings (user_id, options) values
  ('8ba36409-1a31-48f8-a060-29e8283b1011', '{"category":["A"]}'),
  ('8ba36409-1a31-48f8-a060-29e8283b1022', '{"category":["B"]}');

-- 未ログインは両テーブルのすべての操作を拒否されること。
set local role anon;
select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
do $$
declare statement text;
begin
  foreach statement in array array[
    'select * from public.accounts',
    'insert into public.accounts (service_name) values (''拒否されること'')',
    'update public.accounts set service_name = ''拒否されること''',
    'delete from public.accounts',
    'select * from public.user_settings',
    'insert into public.user_settings (options) values (''{}'')',
    'update public.user_settings set options = ''{}''',
    'delete from public.user_settings'
  ] loop
    begin
      execute statement;
      raise exception '未ログインの操作が許可されています: %', statement;
    exception when insufficient_privilege then null;
    end;
  end loop;
end;
$$;
reset role;

-- Aとしてログイン。自分のデータだけCRUDできること。
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"8ba36409-1a31-48f8-a060-29e8283b1011","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '8ba36409-1a31-48f8-a060-29e8283b1011', true);
do $$
declare affected integer; inserted_id uuid;
begin
  if (select count(*) from public.accounts) <> 1 then raise exception 'Aの一覧が所有者で制限されていません'; end if;
  if (select count(*) from public.user_settings) <> 1 then raise exception 'Aの設定が所有者で制限されていません'; end if;

  update public.accounts set notes = 'Aが更新' where id = 'a08dd898-e4ed-4984-9d8b-cd9992841011';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception '所有者が自分の行を更新できません'; end if;
  if (select updated_at from public.accounts where id = 'a08dd898-e4ed-4984-9d8b-cd9992841011') < '2020-01-01' then raise exception '更新日時トリガーが動作していません'; end if;

  insert into public.accounts (service_name) values ('Aの新規登録') returning id into inserted_id;
  delete from public.accounts where id = inserted_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception '所有者が自分の行を削除できません'; end if;

  update public.user_settings set options = '{"category":["更新済み"]}';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception '所有者が自分の設定を更新できません'; end if;

  begin
    insert into public.accounts (user_id, service_name) values ('8ba36409-1a31-48f8-a060-29e8283b1022', '所有者の偽装');
    raise exception '別ユーザーとして登録できてしまいます';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.accounts set user_id = '8ba36409-1a31-48f8-a060-29e8283b1022' where id = 'a08dd898-e4ed-4984-9d8b-cd9992841011';
    raise exception '所有者を書き換えられてしまいます';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.user_settings set user_id = '8ba36409-1a31-48f8-a060-29e8283b1022';
    raise exception '設定の所有者を書き換えられてしまいます';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;

-- Bとしてログイン。Aの行を読めず、更新・削除もできないこと。
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"8ba36409-1a31-48f8-a060-29e8283b1022","role":"authenticated"}', true);
select set_config('request.jwt.claim.sub', '8ba36409-1a31-48f8-a060-29e8283b1022', true);
do $$
declare affected integer;
begin
  if exists (select 1 from public.accounts where id = 'a08dd898-e4ed-4984-9d8b-cd9992841011') then raise exception 'BがAの台帳を読めてしまいます'; end if;
  if exists (select 1 from public.user_settings where user_id = '8ba36409-1a31-48f8-a060-29e8283b1011') then raise exception 'BがAの設定を読めてしまいます'; end if;
  update public.accounts set notes = '不正な更新' where id = 'a08dd898-e4ed-4984-9d8b-cd9992841011';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'BがAの台帳を更新できてしまいます'; end if;
  delete from public.accounts where id = 'a08dd898-e4ed-4984-9d8b-cd9992841011';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'BがAの台帳を削除できてしまいます'; end if;
  update public.user_settings set options = '{}' where user_id = '8ba36409-1a31-48f8-a060-29e8283b1011';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'BがAの設定を更新できてしまいます'; end if;
  delete from public.user_settings where user_id = '8ba36409-1a31-48f8-a060-29e8283b1011';
  get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'BがAの設定を削除できてしまいます'; end if;

  delete from public.user_settings where user_id = '8ba36409-1a31-48f8-a060-29e8283b1022';
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Bが自分の設定を削除できません'; end if;
  insert into public.user_settings (options) values ('{"category":["Bの新規設定"]}');
end;
$$;
reset role;

-- authenticatedロールでも、利用者IDがなければ一覧を取得できないこと。
set local role authenticated;
select set_config('request.jwt.claims', '{}', true);
select set_config('request.jwt.claim.sub', '', true);
do $$
begin
  if exists (select 1 from public.accounts) or exists (select 1 from public.user_settings) then
    raise exception '利用者IDなしでデータを取得できてしまいます';
  end if;
end;
$$;
reset role;

rollback;
select 'PASS: 未ログイン・所有者・別ユーザーのアクセス制限を確認しました。テストデータは破棄しました。' as result;
