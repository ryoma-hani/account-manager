import { supabase } from './supabase.js';

export function onSessionChange(callback) {
  // Authイベント内ではSupabase APIをawaitしない。データ取得はイベント処理の外へ送る。
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    setTimeout(() => callback(event, session), 0);
  });
  return () => data.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}
