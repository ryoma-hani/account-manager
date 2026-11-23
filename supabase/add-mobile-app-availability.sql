-- schema.sql を適用済みのプロジェクトで実行します。既存のログインURLは保持します。
begin;

alter table public.accounts
  add column if not exists has_mobile_app boolean not null default false;

notify pgrst, 'reload schema';
commit;
