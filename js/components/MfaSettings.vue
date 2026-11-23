<template>
  <section class="settings-panel" aria-labelledby="mfa-settings-title">
    <h2 id="mfa-settings-title">台帳のログインを守る2段階認証</h2>
    <p class="subtle">有効にすると、パスワードのあとに認証アプリの6桁の確認コードを入力します。</p>
    <p v-if="isDemo" class="subtle">ログイン後に設定できます。</p>
    <p v-else-if="loading" role="status">2段階認証の状態を確認しています…</p>
    <div v-else-if="!ready" class="mfa-controls">
      <p v-if="!error" class="subtle">2段階認証の利用には、管理者によるデータベースの準備が必要です。</p>
      <button class="button button-secondary" type="button" @click="refresh">
        もう一度確認する
      </button>
    </div>
    <form v-else-if="enrollment" class="mfa-controls" @submit.prevent="verify">
      <p>iPhoneのカメラでQRコードを読み取り、「パスワード」アプリに登録してください。お使いの認証アプリから読み取ることもできます。</p>
      <img class="mfa-qr" :src="enrollment.qrUrl" alt="認証アプリに登録するためのQRコード" width="192" height="192" />
      <details>
        <summary>QRコードを読み取れない場合</summary>
        <p>認証アプリで「設定キーを入力」を選び、次のキーを登録してください。</p>
        <p><code class="mfa-setup-key">{{ enrollment.secret }}</code></p>
      </details>
      <label class="field" for="setup-confirmation-code">
        <span>確認コード</span>
        <input
          id="setup-confirmation-code"
          v-model="code"
          type="text"
          inputmode="numeric"
          autocomplete="one-time-code"
          pattern="[0-9]{6}"
          maxlength="6"
          required
          :disabled="busy"
        />
      </label>
      <div class="mfa-actions">
        <button class="button button-primary" type="submit" :disabled="busy">確認して有効にする</button>
        <button class="button button-secondary" type="button" :disabled="busy" @click="cancel">キャンセル</button>
      </div>
    </form>
    <div v-else-if="factors.length" class="mfa-controls">
      <p><span class="badge badge-success">有効</span></p>
      <ul class="mfa-factors">
        <li v-for="(factor, index) in factors" :key="factor.id">
          <span>{{ factor.friendly_name || '認証アプリ ' + (index + 1) }}</span>
          <div v-if="removeTarget === factor.id" class="mfa-controls">
            <p>{{ factors.length === 1 ? '解除すると、次回から確認コードが不要になります。' : 'この認証アプリを登録から外します。' }}</p>
            <div class="mfa-actions">
              <button class="button button-secondary" type="button" :disabled="busy" @click="remove(factor.id)">解除する</button>
              <button class="text-button" type="button" :disabled="busy" @click="removeTarget = ''">キャンセル</button>
            </div>
          </div>
          <button v-else class="text-button" type="button" :disabled="busy" @click="removeTarget = factor.id">
            登録を解除
          </button>
        </li>
      </ul>
    </div>
    <div v-else class="mfa-controls">
      <p class="subtle">現在は無効です。</p>
      <button class="button button-primary" type="button" :disabled="busy" @click="start">
        {{ busy ? '準備しています…' : '2段階認証を設定する' }}
      </button>
    </div>
    <p v-if="error" class="form-error" role="alert">{{ error }}</p>
    <p v-if="message" role="status">{{ message }}</p>
  </section>
</template>

<script>
import {
  canSetUpSecondFactor,
  enrollSecondFactor,
  listSecondFactors,
  removeSecondFactor,
  secondFactorErrorMessage,
  verifySecondFactor,
} from '../services/auth.js';

export default {
  props: { isDemo: Boolean },
  data: () => ({
    loading: true,
    ready: false,
    busy: false,
    factors: [],
    enrollment: null,
    code: '',
    removeTarget: '',
    error: '',
    message: '',
  }),
  mounted() {
    if (!this.isDemo) this.refresh();
  },
  methods: {
    async refresh() {
      this.loading = true;
      this.error = '';
      try {
        this.ready = await canSetUpSecondFactor();
        if (this.ready) this.factors = (await listSecondFactors()).totp;
      } catch (error) {
        this.ready = false;
        this.error = secondFactorErrorMessage(error);
      } finally {
        this.loading = false;
      }
    },
    async run(action) {
      if (this.busy) return;
      this.busy = true;
      this.error = '';
      this.message = '';
      try {
        await action();
      } catch (error) {
        this.error = secondFactorErrorMessage(error);
      } finally {
        this.busy = false;
      }
    },
    start() {
      return this.run(async () => {
        this.enrollment = await enrollSecondFactor();
      });
    },
    verify() {
      const code = this.code;
      this.code = '';
      return this.run(async () => {
        await verifySecondFactor(this.enrollment.id, code);
        this.enrollment = null;
        await this.refresh();
        this.message = '2段階認証を有効にしました。';
      });
    },
    cancel() {
      return this.run(async () => {
        const { id } = this.enrollment;
        this.enrollment = null;
        this.code = '';
        await removeSecondFactor(id);
      });
    },
    remove(factorId) {
      return this.run(async () => {
        await removeSecondFactor(factorId);
        this.removeTarget = '';
        await this.refresh();
        this.message = '認証アプリの登録を解除しました。';
      });
    },
  },
};
</script>
