# アカウント台帳

どのサービスに、どのIDで登録していて、パスワードをどこに保管しているかを一覧にする個人用Webアプリです。
パスワード本体は保管せず、パスワード管理アプリなどの保管場所と、その中の項目名を記録します。

## 現在の状態

2026年10月27日時点で、ログイン、一覧・検索・絞り込み、登録・編集・削除、点検日の記録、選択肢の設定画面を実装しています。
ログイン前の「サンプルを見る」では架空のデータで操作できます。サンプルの変更はメモリ内だけに反映し、再読み込みでリセットされます。
Supabaseへの初期SQLの適用は完了し、台帳と個人設定の2テーブル、RLS、操作ごとのポリシー、更新日時のトリガーを作成済みです。GitHub Pagesへの初回公開も完了しています。以降は`main`へのpushで自動更新されます。
ログイン用ユーザーは1人作成済みで、メール確認済みです。一般向けの新規登録と匿名サインインは無効、Email認証は有効にしています。
点検判定などの単体テスト8件、ローカルPostgreSQL互換環境と実際のSupabaseでのアクセス制限テストは通過しています。実際のSupabaseでは、本人のCRUD、他人のデータへのアクセス拒否、所有者の偽装拒否、未認証のAPIアクセス拒否を確認しています。検証用データはROLLBACKで破棄しました。
PC・スマートフォンのブラウザ表示とサンプルの操作、APIモックでのログイン・保存・再読み込み・通信失敗時の表示も確認しています。実際の利用者による画面からのログイン・保存と、別ユーザーのログインセッションを使ったAPIアクセス確認は未完了です。
AIで改修するときは[AGENTS.md](./AGENTS.md)を参照してください。

## 採用する構成

- フロントエンド：Vue 3のCDN版グローバルビルド、vue3-sfc-loader、JavaScript ES Modules。
- UI：画面・共通部品を`.vue`に分割し、CSSは基本的に`css/style.css`に集約。
- データ：Supabase Database。
- 認証：Supabase Authのメールアドレス＋パスワード。DBはRLSで所有者ごとにアクセスを制限。
- 公開：GitHub Pages。フロントエンドのビルド工程は設けない。

vue3-sfc-loaderがブラウザ内でSFCをコンパイルします。初回読み込みにはその処理とCDNへの通信が必要です。
ライブラリのバージョンを固定し、更新時にVueとloaderの組み合わせを確認します。

## 初版の対象

添付されたExcelの構造を参考に、次の機能を実装しています。

- ログイン・ログアウト。
- 台帳の一覧、検索、カテゴリ・状態・要点検での絞り込み。
- アカウント情報の登録・編集・削除。
- ログインURLを開く操作。
- 点検状況の自動判定と最終点検日の記録。
- 設定画面での選択肢の管理。
- PCとスマートフォンで使える画面。

Excelのインポート・エクスポートは初版では前提にせず、必要になった段階で追加します。

### 台帳の項目

| 項目 | 扱い |
| --- | --- |
| サービス名 | 登録先の名前 |
| ログインURL | ログイン画面のURL |
| 開く | URLから表示するリンク |
| ログインID | 登録先で使うID |
| 登録メールアドレス | 登録に使ったメールアドレス |
| 保管場所 | パスワード管理アプリなど |
| 保管先での項目名 | 保管場所の中で探すときの名前 |
| 2段階認証 | 利用する認証方法 |
| カテゴリ | サービスの分類 |
| 状態 | 利用状況 |
| 有料/無料 | 課金の有無 |
| 更新日 | 情報を更新した日 |
| 最終点検日 | 登録内容を見直した日 |
| メモ | パスワードや認証コードを含めない補足 |
| 要点検 | 次のルールから自動で表示 |

### 点検ルール

Excelの判定順を引き継ぎ、最初に該当した結果を表示します。
サービス名が空の行には判定結果を表示しません。

1. 2段階認証が「なし」なら「2FAなし」。
2. 保管場所が空なら「保管場所未設定」。
3. 最終点検日が空なら「未点検」。
4. 最終点検日から90日を超えていたら「90日超未点検」。
5. それ以外は「OK」。

この「OK」は上記の点検項目の判定結果です。

### 選択肢の初期値

| 項目 | 選択肢 |
| --- | --- |
| 保管場所 | 1Password、iCloudキーチェーン、Bitwarden、ブラウザ(Chrome等)、紙のノート、その他 |
| 2段階認証 | なし、SMS、認証アプリ、パスキー、セキュリティキー |
| カテゴリ | 仕事、金融・決済、買い物、SNS、開発、娯楽、生活、その他 |
| 状態 | 利用中、休眠、解約予定、解約済 |
| 有料/無料 | 無料、有料 |

## Supabaseの準備

引き継ぎを簡単にするため、友人が所有・管理するSupabaseアカウントでプロジェクトを作ることを推奨します。

1. Supabaseに登録し、プロジェクトを作成します。Securityは「Enable Data API」をON、「Automatically expose new tables」をOFFにします。「Enable automatic RLS」はOFFでも動作します。
2. プロジェクトのConnect画面から、Project URLとPublishable key（`sb_publishable_...`）を確認し、`js/config/supabase.js`に設定します。
3. Authentication → Users → Add user → Create new userで利用者を作成します。メールアドレスとログインパスワードを設定し、Auto confirm userをONにします。ログインパスワードは利用者自身で管理します。
4. Authentication → Sign In / Providersで一般向けの新規登録と匿名サインインを無効にします。Email認証は有効にします。
5. SupabaseのSQL EditorでNew queryを開き、[supabase/schema.sql](./supabase/schema.sql)の全文を貼り付けてRunを押します。このSQLがテーブル、RLS、APIアクセス権限、更新日時のトリガーを作成します。同じ内容は再実行できます。
6. [supabase/verify-access.sql](./supabase/verify-access.sql)を別のクエリで実行し、最後に`PASS`が返ることを確認します。テスト用の2人と台帳データはトランザクション内だけで使い、ROLLBACKで破棄します。途中でエラーになった場合も`ROLLBACK;`を実行してください。
7. アプリから手順3の利用者でログインし、架空のアカウントを登録・編集して、再読み込み後も残ることを確認します。

`schema.sql`は初期セットアップ用です。既存の台帳データを削除しません。今後テーブルの構造を変更するときは、既存データを保つ変更用SQLを追加してください。

Project URLとPublishable keyはブラウザで公開するための情報です。
Secret key、service_role key、DBのパスワード、利用者のログインパスワードは共有・コミットしません。

### なぜ.envではなくconfigのJSに書くのか

このアプリにはビルド工程がなく、ブラウザは`.env`を自動では読み込みません。そのため、公開できる接続情報を`js/config/supabase.js`にまとめています。
Viteの`VITE_...`もビルド時にフロントエンドのJSに含まれる公開情報です。`.env`に置くこと自体は、ブラウザへ渡す値を秘密にする仕組みではありません。
保存データへのアクセスはSupabase AuthとRLSで制御します。

認証のSite URLと必要なRedirect URLsは、公開URLに合わせて設定します。
ローカル確認先は`http://localhost:8000/`です。
公開先は[https://ryoma-hani.github.io/account-manager/](https://ryoma-hani.github.io/account-manager/)です。

Authentication → URL Configurationで、Site URLに予定する公開URLを設定し、Redirect URLsにローカルURLと公開URLを追加します。

### DBの構成

| テーブル | 内容 |
| --- | --- |
| `accounts` | 台帳。所有者の`user_id`とアカウント情報を保存 |
| `user_settings` | 利用者ごとの選択肢。`user_id`ごとに1行 |

「開く」と「要点検」は画面で生成し、DBには保存しません。情報の更新日はDB側のトリガーで自動更新します。

## 開発時の起動方法

プロジェクトのルートで実行します。

```sh
python3 -m http.server 8000
```

`http://localhost:8000/`を開きます。`file://`では起動しません。

8000番で別のアプリが起動している場合は、そのアプリを止めずに別のポートを使います。
今回のローカル確認では8001番を使っています。

```sh
python3 -m http.server 8001 --bind 127.0.0.1
```

この場合は`http://localhost:8001/`を開きます。`/login`など別アプリのURLを使わず、画面のタイトルが「アカウント台帳」であることを確認してください。

単体テストはNode.jsがある環境で、次のコマンドで実行できます。npmのインストール作業は不要です。

```sh
node --test tests/ledger.test.mjs
```

## 公開と引き継ぎ

GitHub Pagesの無料プランでは公開リポジトリを使います。公開されるHTML、JS、SFCに実際の台帳や秘密情報を含めず、実データはSupabaseへ保存します。
公開前に未ログイン・別ユーザーからのAPIアクセス制限と、本人の登録・編集・削除を確認します。

1. GitHubのリポジトリでSettings → Pagesを開き、SourceをGitHub Actionsに設定します。
2. 完成したソースを`main`へpushします。
3. Actionsの「Deploy GitHub Pages」が成功し、Pagesに表示されるURLで起動できることを確認します。

ワークフローは公開に必要な`index.html`、`favicon.svg`、`.nojekyll`、`css/`、`js/`だけをコピーして配信します。フロントエンドのコンパイルは行いません。
SQL、開発資料、テストはPagesの配信対象に含めません。

改修箇所は、画面が`js/pages/`、共通UIが`js/components/`、API通信が`js/services/`、点検ルールなどが`js/utils/`、配色・レイアウトが`css/style.css`です。
引き継ぎ時は、GitHubとSupabaseの管理アカウント、ログイン用のメールアドレス・パスワードの保管先、公開URLを本人が把握できる状態にしてください。

## 技術資料

- [VueのCDN利用](https://vuejs.org/guide/quick-start.html#using-vue-from-cdn)
- [vue3-sfc-loader](https://github.com/FranckFreiburger/vue3-sfc-loader)
- [Supabaseのパスワード認証](https://supabase.com/docs/guides/auth/passwords)
- [SupabaseのAPIキー](https://supabase.com/docs/guides/api/api-keys)
- [SupabaseのRLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages)
