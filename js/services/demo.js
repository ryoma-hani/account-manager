import { blankAccount, todayString } from '../utils/ledger.js';

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return todayString(date);
}

export function demoAccounts() {
  const examples = [
    [
      'Notion',
      '仕事',
      '1Password',
      '認証アプリ',
      '利用中',
      '無料',
      8,
      'Notion / 個人用',
    ],
    [
      'GitHub',
      '開発',
      '1Password',
      'パスキー',
      '利用中',
      '無料',
      3,
      'GitHub / 個人用',
    ],
    [
      'Google',
      '生活',
      'iCloudキーチェーン',
      '認証アプリ',
      '利用中',
      '無料',
      14,
      'Google アカウント',
    ],
    [
      'Amazon',
      '買い物',
      'Bitwarden',
      'なし',
      '利用中',
      '有料',
      32,
      'Amazon / 買い物',
    ],
    [
      'Figma',
      '仕事',
      '1Password',
      '認証アプリ',
      '利用中',
      '無料',
      103,
      'Figma / デザイン',
    ],
    [
      'Netflix',
      '娯楽',
      'iCloudキーチェーン',
      'なし',
      '解約予定',
      '有料',
      45,
      'Netflix',
    ],
    [
      'サンプル銀行',
      '金融・決済',
      '',
      '認証アプリ',
      '利用中',
      '無料',
      null,
      '',
    ],
    [
      'サンプルSNS',
      'SNS',
      'Bitwarden',
      '認証アプリ',
      '休眠',
      '無料',
      null,
      'SNS / 個人用',
    ],
  ];
  return examples.map(
    (
      [
        service_name,
        category,
        storage_location,
        two_factor,
        status,
        billing,
        days,
        storage_item,
      ],
      index,
    ) => ({
      ...blankAccount(),
      id: `sample-${index + 1}`,
      user_id: 'sample',
      service_name,
      category,
      storage_location,
      two_factor,
      status,
      billing,
      storage_item,
      login_url: 'https://example.com/login',
      login_id: index === 1 ? 'sample-user' : 'sample@example.com',
      registered_email: 'sample@example.com',
      last_reviewed_on: days === null ? null : daysAgo(days),
      notes: '表示確認用の架空のデータです。',
      created_at: `${daysAgo(index + 1)}T09:00:00+09:00`,
      updated_at: `${daysAgo(index + 1)}T09:00:00+09:00`,
    }),
  );
}
