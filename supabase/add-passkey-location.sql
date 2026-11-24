-- パスキーを預けた場所の名称だけを保存する。既存行は空欄で開始する。
begin;
alter table public.accounts
  add column if not exists passkey_location text not null default ''
  check (char_length(passkey_location) <= 100);
notify pgrst, 'reload schema';
commit;
