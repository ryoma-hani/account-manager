const dayMs = 86400000;

export function todayString(now = new Date()) {
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
}

export function dateDay(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value ?? '')) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  return date.getTime() / dayMs;
}

export function reviewStatus(account, today = todayString()) {
  if (!account.service_name?.trim())
    return { label: '', tone: 'muted', needsReview: false };
  if (account.two_factor === 'なし')
    return { label: '2FAなし', tone: 'warning', needsReview: true };
  if (!account.storage_location?.trim())
    return { label: '保管場所未設定', tone: 'warning', needsReview: true };
  const reviewed = dateDay(account.last_reviewed_on);
  if (reviewed === null)
    return { label: '未点検', tone: 'neutral', needsReview: true };
  if (dateDay(today) - reviewed > 90)
    return { label: '90日超未点検', tone: 'warning', needsReview: true };
  return { label: 'OK', tone: 'success', needsReview: false };
}

export function safeUrl(value) {
  try {
    const url = new URL(value);
    return ['https:', 'http:'].includes(url.protocol) &&
      !url.username &&
      !url.password
      ? url.href
      : '';
  } catch {
    return '';
  }
}

export function displayHost(value) {
  const url = safeUrl(value);
  return url ? new URL(url).hostname.replace(/^www\./, '') : '';
}

export function displayDate(value) {
  if (!value) return '未設定';
  // 点検日はそのまま、DBのタイムスタンプは利用端末の日付に変換する。
  let day = value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '未設定';
    day = todayString(date);
  }
  return dateDay(day) === null ? '未設定' : day.replaceAll('-', '/');
}

export function blankAccount() {
  return {
    service_name: '',
    login_url: '',
    login_id: '',
    registered_email: '',
    storage_location: '',
    storage_item: '',
    two_factor: '',
    category: '',
    status: '利用中',
    billing: '無料',
    last_reviewed_on: '',
    notes: '',
  };
}

export function accountPayload(account) {
  const payload = Object.fromEntries(
    Object.keys(blankAccount()).map((key) => [
      key,
      String(account[key] ?? '').trim(),
    ]),
  );
  payload.last_reviewed_on = payload.last_reviewed_on || null;
  return payload;
}

export function validateAccount(account, today = todayString()) {
  if (!account.service_name.trim()) return 'サービス名を入力してください。';
  if (account.service_name.trim().length > 200)
    return 'サービス名は200文字以内で入力してください。';
  if (account.login_url && !safeUrl(account.login_url))
    return 'ログインURLは、IDやパスワードを含まない http:// または https:// のURLを入力してください。';
  if (
    account.registered_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.registered_email)
  )
    return '登録メールアドレスを確認してください。';
  if (account.last_reviewed_on && dateDay(account.last_reviewed_on) === null)
    return '最終点検日を確認してください。';
  if (account.last_reviewed_on && account.last_reviewed_on > today)
    return '最終点検日に未来の日付は指定できません。';
  return '';
}

export function choicesFor(key, options, current = '') {
  return [...new Set([...(options[key] ?? []), ...(current ? [current] : [])])];
}

export function filterAccounts(accounts, filters, today = todayString()) {
  const query = (filters.search ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase('ja')
    .trim();
  const terms = query.split(/\s+/).filter(Boolean);
  return accounts.filter((account) => {
    if (filters.category && account.category !== filters.category) return false;
    if (filters.status && account.status !== filters.status) return false;
    if (filters.billing && account.billing !== filters.billing) return false;
    const review = reviewStatus(account, today);
    if (filters.review === 'needed' && !review.needsReview) return false;
    if (filters.review === 'ok' && review.needsReview) return false;
    const text = Object.values(accountPayload(account))
      .join(' ')
      .normalize('NFKC')
      .toLocaleLowerCase('ja');
    return terms.every((term) => text.includes(term));
  });
}
