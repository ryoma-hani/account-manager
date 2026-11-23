import { errorMessage, supabase } from './supabase.js';

const authenticatorName = 'アカウント台帳';

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

export async function updatePassword(currentPassword, password) {
  const { error } = await supabase.auth.updateUser({
    current_password: currentPassword,
    password,
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function readSecondFactor(accessToken) {
  const { data, error } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel(accessToken);
  if (error) throw error;
  if (data.currentLevel === 'aal2' || data.nextLevel !== 'aal2') return null;

  const { totp } = await listSecondFactors();
  return totp;
}

export async function listSecondFactors() {
  const { data, error } = await supabase.auth.mfa.listFactors();
  if (error) throw error;
  return data;
}

export async function canSetUpSecondFactor() {
  const { data, error } = await supabase.rpc('ledger_mfa_available');
  if (error?.code === 'PGRST202') return false;
  if (error) throw error;
  return data === true;
}

export async function enrollSecondFactor() {
  const { all } = await listSecondFactors();
  for (const factor of all) {
    if (factor.factor_type === 'totp' && factor.status === 'unverified' &&
        factor.friendly_name === authenticatorName) {
      await removeSecondFactor(factor.id);
    }
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: authenticatorName,
    friendlyName: authenticatorName,
  });
  if (error) throw error;
  const { qr_code: svg, secret } = data.totp;
  return {
    id: data.id,
    qrUrl: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(
      svg.replace(/^data:image\/svg\+xml(?:;utf-8)?,/, ''),
    ),
    secret,
  };
}

export async function verifySecondFactor(factorId, code) {
  const normalizedCode = code.trim();
  if (!/^\d{6}$/.test(normalizedCode))
    throw { code: 'mfa_invalid_code_format' };
  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId,
    code: normalizedCode,
  });
  if (error) throw error;
}

export async function removeSecondFactor(factorId) {
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
}

export function secondFactorErrorMessage(error) {
  switch (error?.code) {
    case 'mfa_invalid_code_format':
      return '認証アプリに表示された6桁の数字を入力してください。';
    case 'mfa_verification_failed':
    case 'mfa_challenge_expired':
      return '確認コードが一致しないか、期限が切れています。認証アプリの新しいコードを入力してください。';
    case 'mfa_totp_enroll_not_enabled':
    case 'mfa_totp_verify_not_enabled':
      return '認証アプリによる確認が無効になっています。管理者にご確認ください。';
    case 'mfa_factor_not_found':
      return '認証アプリの登録が変更されました。設定を開き直すか、もう一度ログインしてください。';
    default:
      return errorMessage(error);
  }
}
