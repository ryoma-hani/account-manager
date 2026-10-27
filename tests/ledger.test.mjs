import test from 'node:test';
import assert from 'node:assert/strict';
import {
  reviewStatus,
  dateDay,
  displayDate,
  filterAccounts,
  safeUrl,
  validateAccount,
  blankAccount,
  accountPayload,
  choicesFor,
} from '../js/utils/ledger.js';
import { normalizeOptions, freshOptions } from '../js/config/options.js';

const account = {
  ...blankAccount(),
  service_name: 'GitHub',
  login_id: 'Sample.User',
  storage_location: '1Password',
  two_factor: '認証アプリ',
  category: '開発',
  last_reviewed_on: '2026-07-29',
};

test('90日まではOK、91日から要点検。時差のある環境でも日付だけで比較する', () => {
  assert.equal(reviewStatus(account, '2026-10-27').label, 'OK');
  assert.equal(
    reviewStatus({ ...account, last_reviewed_on: '2026-07-28' }, '2026-10-27')
      .label,
    '90日超未点検',
  );
  assert.equal(dateDay('2026-10-27') - dateDay('2026-07-29'), 90);
});

test('Excelと同じ優先順で判定する', () => {
  const missing = {
    ...account,
    storage_location: '',
    last_reviewed_on: '',
    two_factor: 'なし',
  };
  assert.equal(reviewStatus(missing).label, '2FAなし');
  assert.equal(
    reviewStatus({ ...missing, two_factor: '' }).label,
    '保管場所未設定',
  );
  assert.equal(
    reviewStatus({ ...missing, two_factor: '', storage_location: 'Bitwarden' })
      .label,
    '未点検',
  );
  assert.equal(reviewStatus({ ...missing, service_name: '' }).label, '');
});

test('無効な日付や未来の点検日を登録しない', () => {
  assert.equal(dateDay('2026-02-30'), null);
  assert.equal(dateDay('2026-2-1'), null);
  assert.equal(dateDay('2024-02-29') !== null, true);
  assert.ok(
    validateAccount(
      { ...account, last_reviewed_on: '2026-10-28' },
      '2026-10-27',
    ),
  );
});

test('点検日は日付を保ち、更新日時は利用端末の日付で表示する', () => {
  assert.equal(displayDate('2026-10-27'), '2026/10/27');
  const justAfterMidnight = new Date(2026, 9, 27, 0, 15).toISOString();
  assert.equal(displayDate(justAfterMidnight), '2026/10/27');
  assert.equal(displayDate('invalid'), '未設定');
});

test('URLはhttpとhttpsのみ、URL内の資格情報を許可しない', () => {
  assert.equal(
    safeUrl('https://example.com/login'),
    'https://example.com/login',
  );
  assert.equal(safeUrl('javascript:alert(1)'), '');
  assert.equal(safeUrl('data:text/html,test'), '');
  assert.equal(safeUrl('https://user:secret@example.com'), '');
  assert.equal(safeUrl('/login'), '');
});

test('全半角・大文字小文字を吸収し、複数条件を組み合わせて検索する', () => {
  const rows = [
    account,
    {
      ...account,
      service_name: 'Amazon',
      category: '買い物',
      two_factor: 'なし',
      billing: '有料',
    },
  ];
  assert.equal(
    filterAccounts(rows, { search: 'ＧＩＴＨＵＢ sample' }).length,
    1,
  );
  assert.equal(
    filterAccounts(
      rows,
      { category: '買い物', review: 'needed', billing: '有料' },
      '2026-10-27',
    )[0].service_name,
    'Amazon',
  );
  assert.equal(
    filterAccounts(rows, { search: 'GitHub', category: '買い物' }).length,
    0,
  );
});

test('保存対象をホワイトリスト化し、空の点検日はnullにする', () => {
  const payload = accountPayload({
    ...account,
    last_reviewed_on: '',
    id: 'id',
    user_id: 'other',
    unexpected: 'value',
  });
  assert.equal('id' in payload, false);
  assert.equal('user_id' in payload, false);
  assert.equal('unexpected' in payload, false);
  assert.equal(payload.last_reviewed_on, null);
});

test('選択肢から削除しても既存の値を編集でき、初期値の参照を共有しない', () => {
  const options = normalizeOptions({
    category: ['  個人  ', '個人', '', 42],
    status: [],
  });
  assert.deepEqual(options.category, ['個人']);
  assert.ok(options.status.length);
  assert.deepEqual(choicesFor('category', options, '以前のカテゴリ'), [
    '個人',
    '以前のカテゴリ',
  ]);
  const first = freshOptions();
  first.category.push('追加');
  assert.equal(freshOptions().category.includes('追加'), false);
});
