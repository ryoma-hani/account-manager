<template>
  <main class="login-page">
    <section class="login-story" aria-label="アカウント台帳について">
      <div class="brand">
        <span class="brand-mark"><app-icon name="book" :size="23" /></span
        ><span
          >アカウント台帳<span class="brand-caption">ACCOUNT LEDGER</span></span
        >
      </div>
      <div class="login-story-content">
        <span class="eyebrow">暮らしのアカウントを整理する</span>
        <h1>あのサービスの登録情報、<br />すぐに見つかる場所に。</h1>
        <p>
          ログインIDも、パスワードの保管場所も。<br />ひとつの台帳にまとめて、すっきり管理。
        </p>
        <div class="preview-stack" aria-hidden="true">
          <div class="preview-card">
            <span class="service-avatar violet">N</span>
            <div>
              <strong>仕事のツール</strong><span>sample@example.com</span>
            </div>
            <span class="preview-status"
              ><app-icon name="check" :size="13" />点検済み</span
            >
          </div>
          <div class="preview-card">
            <span class="service-avatar blue">G</span>
            <div>
              <strong>いつものサービス</strong><span>保管場所：1Password</span>
            </div>
            <span class="preview-status"
              ><app-icon name="shield" :size="15"
            /></span>
          </div>
          <div class="preview-card">
            <span class="service-avatar amber">S</span>
            <div>
              <strong>よく使うアプリ</strong
              ><span>保管場所：iCloudキーチェーン</span>
            </div>
          </div>
        </div>
      </div>
      <p class="login-story-footer">
        <app-icon
          name="lock"
          :size="15"
        />パスワード本体は、いつもの保管場所で管理します。
      </p>
    </section>
    <section class="login-form-area">
      <div class="login-form-wrap">
        <template v-if="checkingSecondFactor">
          <span class="login-symbol"><app-icon name="shield" :size="27" /></span>
          <h2>2段階認証</h2>
          <p v-if="authCheckError" class="form-error" role="alert">{{ authCheckError }}</p>
          <button v-if="authCheckError" type="button" class="button button-secondary" @click="$emit('retry')">
            もう一度確認する
          </button>
          <template v-else>
            <p class="subtle">認証アプリで「アカウント台帳」の6桁の確認コードを開いてください。</p>
            <form class="login-form" @submit.prevent="verify">
              <template v-if="factors.length > 1">
                <label for="login-factor">認証アプリの登録先</label>
                <select id="login-factor" v-model="selectedFactor" :disabled="busy">
                  <option v-for="(factor, index) in factors" :key="factor.id" :value="factor.id">
                    {{ factor.friendly_name || '認証アプリ ' + (index + 1) }}
                  </option>
                </select>
              </template>
              <label for="login-confirmation-code">確認コード</label>
              <input
                id="login-confirmation-code"
                v-model="code"
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                pattern="[0-9]{6}"
                maxlength="6"
                required
                :disabled="busy"
              />
              <p v-if="error" class="form-error" role="alert">{{ error }}</p>
              <button class="button button-primary login-submit" type="submit" :disabled="busy">
                {{ busy ? '確認しています…' : 'コードを確認してログイン' }}
              </button>
            </form>
          </template>
          <p class="login-help">
            <button class="text-button" type="button" :disabled="busy" @click="$emit('logout')">
              ログイン画面に戻る
            </button>
          </p>
        </template>
        <template v-else>
          <span class="login-symbol"><app-icon name="book" :size="27" /></span>
          <h2>おかえりなさい</h2>
          <p class="subtle">ログインして、あなたの台帳を開きましょう。</p>
          <form class="login-form" @submit.prevent="submit">
            <label for="login-email">メールアドレス</label>
            <input
              id="login-email"
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="you@example.com"
              required
              :disabled="busy"
            />
            <label for="login-password">パスワード</label>
            <div class="password-input">
              <input
                id="login-password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="ログインパスワード"
                required
                :disabled="busy"
              /><button
                type="button"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
              >
                {{ showPassword ? '隠す' : '表示' }}
              </button>
            </div>
            <p v-if="error" class="form-error" role="alert">{{ error }}</p>
            <button
              class="button button-primary login-submit"
              type="submit"
              :disabled="busy"
            >
              <span>{{ busy ? 'ログインしています…' : 'ログイン' }}</span
              ><app-icon v-if="!busy" name="arrow" :size="18" />
            </button>
          </form>
          <p class="login-help">
            管理者が作成したアカウントでログインしてください。<br />ログインできない場合は、管理者にご確認ください。
          </p>
          <div class="login-divider"><span>まずは使い心地を見てみる</span></div>
          <button
            class="button button-secondary demo-button"
            :disabled="busy"
            @click="$emit('demo')"
          >
            サンプルを見る<app-icon name="arrow" :size="17" />
          </button>
          <p class="demo-caption">ログイン不要・架空のデータで試せます</p>
        </template>
      </div>
    </section>
  </main>
</template>
<script>
import AppIcon from './AppIcon.vue';
export default {
  components: { AppIcon },
  props: {
    busy: Boolean,
    error: String,
    checkingSecondFactor: Boolean,
    authCheckError: String,
    factors: { type: Array, default: () => [] },
  },
  emits: ['login', 'demo', 'verify', 'retry', 'logout'],
  data: () => ({ email: '', password: '', showPassword: false, code: '', selectedFactor: '' }),
  watch: {
    factors: {
      immediate: true,
      handler(factors) {
        if (!factors.some(({ id }) => id === this.selectedFactor))
          this.selectedFactor = factors[0]?.id ?? '';
      },
    },
  },
  methods: {
    submit() {
      if (!this.busy) {
        this.$emit('login', { email: this.email, password: this.password });
        this.password = '';
      }
    },
    verify() {
      if (this.busy || !this.selectedFactor) return;
      this.$emit('verify', { factorId: this.selectedFactor, code: this.code });
      this.code = '';
    },
  },
};
</script>
