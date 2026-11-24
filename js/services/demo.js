import { blankAccount, todayString } from '../utils/ledger.js?v=5';

function daysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return todayString(date);
}

export function demoAccounts() {
  const examples = [
    [
      'はま寿司',
      '生活',
      '',
      '',
      '利用中',
      null,
      '',
    ],
    [
      'Notion',
      '仕事',
      '1Password',
      '認証アプリ',
      '利用中',
      8,
      'Notion / 個人用',
    ],
    [
      'GitHub',
      '開発',
      '1Password',
      'パスキー',
      '利用中',
      3,
      'GitHub / 個人用',
    ],
    [
      'Google',
      '生活',
      'iCloudキーチェーン',
      '認証アプリ',
      '利用中',
      14,
      'Google アカウント',
    ],
    [
      'Amazon',
      '買い物',
      'Bitwarden',
      'なし',
      '利用中',
      32,
      'Amazon / 買い物',
    ],
    [
      'Figma',
      '仕事',
      'ノートン パスワード マネージャー',
      '認証アプリ',
      '利用中',
      103,
      'Figma / デザイン',
    ],
    [
      'Netflix',
      '娯楽',
      'iCloudキーチェーン',
      'なし',
      '解約予定',
      45,
      'Netflix',
    ],
    [
      'サンプル銀行',
      '金融・決済',
      '',
      '認証アプリ',
      '利用中',
      null,
      '',
    ],
    [
      'サンプルSNS',
      'SNS',
      'Bitwarden',
      '認証アプリ',
      '休眠',
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
      storage_item,
      login_url: service_name === 'はま寿司'
        ? 'https://my.hama-sushi.co.jp/'
        : service_name === 'サンプルSNS' ? '' : 'https://example.com/login',
      has_mobile_app: ['Notion', 'Amazon', 'Netflix', 'サンプルSNS', 'はま寿司'].includes(service_name),
      login_id: service_name === 'GitHub' ? 'sample-user' : 'sample@example.com',
      registered_email: 'sample@example.com',
      last_reviewed_on: days === null ? null : daysAgo(days),
      notes: '表示確認用の架空のデータです。',
      created_at: `${daysAgo(index + 1)}T09:00:00+09:00`,
      updated_at: `${daysAgo(index + 1)}T09:00:00+09:00`,
    }),
  );
}
