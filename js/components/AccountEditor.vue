<template>
  <dialog
    ref="dialog"
    class="editor-dialog"
    aria-labelledby="editor-title"
    @cancel.prevent="close"
    @click="backdrop"
  >
    <header class="dialog-header">
      <div>
        <span class="eyebrow">アカウント情報</span>
        <h2 id="editor-title">
          {{ account ? '登録情報を編集' : 'アカウントを追加' }}
        </h2>
      </div>
      <button
        class="icon-button"
        :disabled="saving"
        aria-label="編集画面を閉じる"
        @click="close"
      >
        <app-icon name="close" />
      </button>
    </header>
    <form @submit.prevent="submit">
      <div class="editor-content">
        <p class="editor-intro">
          登録先の情報と、パスワードを探すための場所を記録します。
        </p>
        <fieldset :disabled="saving">
          <legend>基本情報</legend>
          <div class="form-grid">
            <label class="field field-wide" for="service-name"
              ><span>サービス名 <span class="required-label">必須</span></span
              ><input
                id="service-name"
                v-model="form.service_name"
                placeholder="例：Notion"
                maxlength="200"
                required
                autofocus
            /></label>
            <label class="field field-wide" for="login-url"
              ><span>ログインURL</span
              ><input
                id="login-url"
                v-model.trim="form.login_url"
                type="url"
                placeholder="https://example.com/login"
                maxlength="2048"
            /></label>
            <label class="field" for="account-login-id"
              ><span>ログインID</span
              ><input
                id="account-login-id"
                v-model="form.login_id"
                placeholder="ユーザー名やメールアドレス"
                maxlength="500"
                autocomplete="off"
            /></label>
            <label class="field" for="registered-email"
              ><span>登録メールアドレス</span
              ><input
                id="registered-email"
                v-model.trim="form.registered_email"
                type="email"
                placeholder="you@example.com"
                maxlength="320"
            /></label>
          </div>
        </fieldset>
        <fieldset :disabled="saving">
          <legend>パスワードの保管先</legend>
          <div class="form-grid">
            <label class="field" for="storage-location"
              ><span>保管場所</span
              ><select id="storage-location" v-model="form.storage_location">
                <option value="">未設定</option>
                <option
                  v-for="value in choices('storage_location')"
                  :key="value"
                >
                  {{ value }}
                </option>
              </select></label
            >
            <label class="field" for="two-factor"
              ><span>2段階認証</span
              ><select id="two-factor" v-model="form.two_factor">
                <option value="">未設定</option>
                <option v-for="value in choices('two_factor')" :key="value">
                  {{ value }}
                </option>
              </select></label
            >
            <label
              v-if="form.two_factor === 'SMS'"
              class="field field-wide factor-detail-field"
              for="two-factor-phone"
            >
              <span>SMSを受け取る電話番号</span>
              <select
                id="two-factor-phone"
                v-model="twoFactorPhoneLineId"
                required
              >
                <option value="">電話番号を選択してください</option>
                <option
                  v-for="line in phoneLines"
                  :key="line.id"
                  :value="line.id"
                >
                  {{ line.carrier }} · {{ line.phone_number }}
                </option>
              </select>
              <small v-if="!phoneLines.length" class="factor-detail-help">
                先にワークスペースの「電話番号」で携帯会社と番号を登録してください。
              </small>
            </label>
            <template v-if="form.two_factor === '認証アプリ'">
              <label class="field" for="authenticator-app">
                <span>認証アプリ</span>
                <select id="authenticator-app" v-model="authenticatorChoice">
                  <option value="">アプリを選択してください</option>
                  <option v-for="app in authenticatorApps" :key="app" :value="app">{{ app }}</option>
                  <option value="other">その他（手入力）</option>
                </select>
              </label>
              <label
                v-if="authenticatorChoice === 'other'"
                class="field"
                for="authenticator-app-other"
              >
                <span>アプリ名</span>
                <input
                  id="authenticator-app-other"
                  v-model.trim="customAuthenticator"
                  maxlength="70"
                  placeholder="使用している認証アプリ"
                  required
                />
              </label>
            </template>
          </div>
          <p class="field-note">
            <app-icon
              name="lock"
              :size="14"
            />パスワード・認証コード・リカバリーコードは入力しないでください。
          </p>
        </fieldset>
        <fieldset :disabled="saving">
          <legend>分類と点検</legend>
          <div class="form-grid">
            <label class="field" for="account-category"
              ><span>カテゴリ</span
              ><select id="account-category" v-model="form.category">
                <option value="">未分類</option>
                <option v-for="value in choices('category')" :key="value">
                  {{ value }}
                </option>
              </select></label
            >
            <label class="field" for="account-status"
              ><span>状態</span
              ><select id="account-status" v-model="form.status">
                <option value="">未設定</option>
                <option v-for="value in choices('status')" :key="value">
                  {{ value }}
                </option>
              </select></label
            >
            <label class="field" for="reviewed-date"
              ><span>最終点検日</span
              ><input
                id="reviewed-date"
                v-model="form.last_reviewed_on"
                type="date"
                :max="today"
            /></label>
            <label class="field field-wide" for="account-notes"
              ><span>メモ</span
              ><textarea
                id="account-notes"
                v-model="form.notes"
                rows="3"
                placeholder="用途や見直すときのメモ。パスワードは書かないでください。"
                maxlength="5000"
              ></textarea>
            </label>
          </div>
        </fieldset>
        <div class="editor-review">
          <span>現在の点検状況</span
          ><span class="badge" :class="'badge-' + review.tone">{{
            review.label || 'サービス名を入力してください'
          }}</span>
        </div>
        <p v-if="account" class="field-note">
          情報の更新日：{{
            displayDate(account.updated_at)
          }}（保存時に更新されます）
        </p>
        <p v-if="validation || error" class="form-error" role="alert">
          {{ validation || error }}
        </p>
      </div>
      <footer class="dialog-footer">
        <button
          class="button button-secondary"
          type="button"
          :disabled="saving"
          @click="close"
        >
          キャンセル</button
        ><button class="button button-primary" type="submit" :disabled="saving">
          {{
            saving
              ? '保存しています…'
              : account
                ? '変更を保存'
                : 'アカウントを追加'
          }}
        </button>
      </footer>
    </form>
  </dialog>
</template>
<script>
import AppIcon from './AppIcon.vue';
import {
  blankAccount,
  todayString,
  choicesFor,
  reviewStatus,
  validateAccount,
  displayDate,
} from '../utils/ledger.js';

const authenticatorApps = [
  'Google Authenticator',
  'Microsoft Authenticator',
  'Authy',
  '1Password',
  'iCloudパスワード',
  'Bitwarden',
];

function parseTwoFactor(value = '') {
  const raw = String(value ?? '');
  if (raw.startsWith('SMS::')) {
    const separator = raw.lastIndexOf('::');
    const carrier = raw.slice('SMS::'.length, separator);
    const phoneNumber = raw.slice(separator + 2);
    return { method: 'SMS', carrier, phoneNumber, appName: '' };
  }
  if (raw.startsWith('認証アプリ::'))
    return { method: '認証アプリ', appName: raw.slice('認証アプリ::'.length) };
  return { method: raw, carrier: '', phoneNumber: '', appName: '' };
}

export default {
  components: { AppIcon },
  props: {
    account: Object,
    initialValues: Object,
    options: { type: Object, required: true },
    phoneLines: { type: Array, default: () => [] },
    saving: Boolean,
    error: String,
  },
  emits: ['close', 'save'],
  data() {
    const parsed = parseTwoFactor(
      this.account?.two_factor ?? this.initialValues?.two_factor,
    );
    const matchingLine = this.phoneLines.find(
      (line) =>
        line.carrier === parsed.carrier &&
        line.phone_number === parsed.phoneNumber,
    );
    const knownApp = authenticatorApps.includes(parsed.appName);
    return {
      form: {
        ...blankAccount(),
        ...(this.account ?? {}),
        ...(this.initialValues ?? {}),
        last_reviewed_on: this.account?.last_reviewed_on ?? '',
        two_factor: parsed.method,
      },
      authenticatorApps,
      twoFactorPhoneLineId: matchingLine?.id ?? '',
      authenticatorChoice: knownApp ? parsed.appName : parsed.appName ? 'other' : '',
      customAuthenticator: knownApp ? '' : parsed.appName,
      validation: '',
      today: todayString(),
    };
  },
  computed: {
    review() {
      return reviewStatus(this.form, this.today);
    },
  },
  mounted() {
    this.$refs.dialog.showModal();
  },
  beforeUnmount() {
    this.$refs.dialog?.close();
  },
  methods: {
    displayDate,
    choices(key) {
      return choicesFor(key, this.options, this.form[key]);
    },
    close() {
      if (!this.saving) this.$emit('close');
    },
    backdrop(event) {
      if (event.target === this.$refs.dialog) {
        const bounds = this.$refs.dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          this.close();
      }
    },
    submit() {
      if (this.saving) return;
      this.validation = validateAccount(this.form, this.today);
      const value = { ...this.form };
      if (!this.validation && value.two_factor === 'SMS') {
        const line = this.phoneLines.find(
          (item) => item.id === this.twoFactorPhoneLineId,
        );
        if (!line) this.validation = 'SMSを受け取る電話番号を選択してください。';
        else value.two_factor = `SMS::${line.carrier}::${line.phone_number}`;
      }
      if (!this.validation && value.two_factor === '認証アプリ') {
        const appName =
          this.authenticatorChoice === 'other'
            ? this.customAuthenticator.trim()
            : this.authenticatorChoice;
        if (!appName) this.validation = '使用している認証アプリを選択してください。';
        else value.two_factor = `認証アプリ::${appName}`;
      }
      if (!this.validation && value.two_factor.length > 100)
        this.validation =
          '2段階認証の詳細が長すぎます。会社名またはアプリ名を短くしてください。';
      if (!this.validation) this.$emit('save', value);
    },
  },
};
</script>
