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
            <label class="field" for="storage-item"
              ><span>保管先での項目名</span
              ><input
                id="storage-item"
                v-model="form.storage_item"
                placeholder="例：Notion / 個人用"
                maxlength="500"
            /></label>
            <label class="field" for="two-factor"
              ><span>2段階認証</span
              ><select id="two-factor" v-model="form.two_factor">
                <option value="">未設定</option>
                <option v-for="value in choices('two_factor')" :key="value">
                  {{ value }}
                </option>
              </select></label
            >
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
            <label class="field" for="account-billing"
              ><span>有料/無料</span
              ><select id="account-billing" v-model="form.billing">
                <option value="">未設定</option>
                <option v-for="value in choices('billing')" :key="value">
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
export default {
  components: { AppIcon },
  props: {
    account: Object,
    options: { type: Object, required: true },
    saving: Boolean,
    error: String,
  },
  emits: ['close', 'save'],
  data() {
    return {
      form: {
        ...blankAccount(),
        ...(this.account ?? {}),
        last_reviewed_on: this.account?.last_reviewed_on ?? '',
      },
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
      if (!this.validation) this.$emit('save', { ...this.form });
    },
  },
};
</script>
