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
              <strong>毎日のサブスク</strong
              ><span>保管場所：iCloudキーチェーン</span>
            </div>
            <span class="badge badge-neutral">有料</span>
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
      </div>
    </section>
  </main>
</template>
<script>
import AppIcon from './AppIcon.vue';
export default {
  components: { AppIcon },
  props: { busy: Boolean, error: String },
  emits: ['login', 'demo'],
  data: () => ({ email: '', password: '', showPassword: false }),
  methods: {
    submit() {
      if (!this.busy) {
        this.$emit('login', { email: this.email, password: this.password });
        this.password = '';
      }
    },
  },
};
</script>
