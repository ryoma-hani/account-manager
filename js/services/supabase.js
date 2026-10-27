import { supabaseConfig } from '../config/supabase.js';

if (!window.supabase?.createClient)
  throw new Error(
    'Supabaseを読み込めませんでした。通信環境を確認して再読み込みしてください。',
  );

export const supabase = window.supabase.createClient(
  supabaseConfig.url,
  supabaseConfig.publishableKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  },
);

export function errorMessage(error) {
  if (['PGRST205', '42P01', '42501'].includes(error?.code))
    return 'データベースの準備が必要です。SupabaseのSQL Editorで supabase/schema.sql を実行してください。';
  if (error?.status === 401 || error?.code === 'PGRST301')
    return 'ログインの有効期限が切れました。一度ログアウトして、もう一度ログインしてください。';
  if (error?.code === 'invalid_credentials')
    return 'メールアドレスまたはパスワードが正しくありません。';
  if (error?.code === 'email_not_confirmed')
    return 'メールアドレスが未確認です。Supabaseの利用者設定を確認してください。';
  if (error?.status === 429 || error?.code === 'over_request_rate_limit')
    return '試行回数が多くなっています。少し待ってからお試しください。';
  if (error?.message?.includes('fetch') || error instanceof TypeError)
    return '通信できませんでした。インターネット接続を確認して、もう一度お試しください。';
  return '処理を完了できませんでした。時間をおいて、もう一度お試しください。';
}
