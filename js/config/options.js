export const optionFields = Object.freeze([
  {
    key: 'storage_location',
    label: '保管場所',
    description: 'パスワードを保管しているアプリや場所',
  },
  {
    key: 'two_factor',
    label: '2段階認証',
    description: 'サービスで利用している追加の認証方法',
  },
  {
    key: 'category',
    label: 'カテゴリ',
    description: 'アカウントを探しやすくするための分類',
  },
  { key: 'status', label: '状態', description: 'サービスの利用状況' },
  { key: 'billing', label: '有料/無料', description: 'サービスの課金区分' },
]);

export const defaultOptions = Object.freeze({
  storage_location: Object.freeze([
    '1Password',
    'iCloudキーチェーン',
    'Bitwarden',
    'ブラウザ(Chrome等)',
    '紙のノート',
    'その他',
  ]),
  two_factor: Object.freeze([
    'なし',
    'SMS',
    '認証アプリ',
    'パスキー',
    'セキュリティキー',
  ]),
  category: Object.freeze([
    '仕事',
    '金融・決済',
    '買い物',
    'SNS',
    '開発',
    '娯楽',
    '生活',
    'その他',
  ]),
  status: Object.freeze(['利用中', '休眠', '解約予定', '解約済']),
  billing: Object.freeze(['無料', '有料']),
});

export function freshOptions() {
  return Object.fromEntries(
    optionFields.map(({ key }) => [key, [...defaultOptions[key]]]),
  );
}

export function normalizeOptions(value) {
  const result = freshOptions();
  for (const { key } of optionFields) {
    if (Array.isArray(value?.[key])) {
      const cleaned = [
        ...new Set(
          value[key]
            .filter((item) => typeof item === 'string')
            .map((item) => item.trim())
            .filter(Boolean),
        ),
      ];
      if (cleaned.length) result[key] = cleaned;
    }
  }
  return result;
}
